"""
Scrapy scraping engine — aislado con multiprocessing.

Por qué multiprocessing y no threading
----------------------------------------
Scrapy instala el reactor de Twisted de forma **global** dentro del proceso.
Una vez que ``reactor.run()`` termina, el reactor queda marcado como
"ya corrido" y Scrapy lanza ``ReactorNotRestartable`` en cualquier intento
posterior de arrancar un nuevo ``CrawlerProcess`` **en el mismo proceso**,
aunque se use un hilo distinto.

La única solución robusta es aislar cada ejecución en un **subproceso**
separado (``multiprocessing.Process``).  Cada subproceso tiene su propio
espacio de memoria, por lo que el reactor de Twisted siempre comienza virgen.

Flujo:
  FastAPI request  (asyncio loop)
    └─► asyncio.to_thread ──────────► hilo puente  (bloquea asyncio mínimamente)
                                        └─► multiprocessing.Process   (spawn)
                                              └─► _worker()
                                                    └─► CrawlerProcess (bloquea)
                                                    └─► resultados → Queue
                                        └─► process.join(timeout)
                                        └─► lee Queue → retorna al hilo puente
    ◄── asyncio.wait_for (timeout) ──────────────────────────────────────────
"""
from __future__ import annotations

import asyncio
import logging
import multiprocessing
import multiprocessing.queues
import time
from typing import Any

import scrapy
from scrapy.crawler import CrawlerProcess
from scrapy.http import Response as ScrapyResponse
from scrapy.utils.project import get_project_settings

from app.core.exceptions import (
    HTTPError,
    InvalidURLError,
    MaxRetriesExceededError,
    ParseError,
    SelectorNotFoundError,
    TimeoutError,
)
from app.schemas.scrape import (
    ScrapeMetadata,
    ScrapeRequest,
    ScrapeResponse,
    SelectorConfig,
    SelectorResult,
)
from app.scrapers.base import BaseScraper
from app.utils.user_agents import get_random_user_agent

log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Generic Spider  (definido a nivel de módulo para que pickle lo encuentre)
# ---------------------------------------------------------------------------

class GenericSpider(scrapy.Spider):
    """
    Spider configurable de un solo disparo.
    Visita una URL, aplica selectores CSS y deposita el resultado en
    ``results_store`` (lista compartida con el llamador).
    """

    name = "generic_spider"
    custom_settings: dict[str, Any] = {
        "LOG_ENABLED": False,
        "ROBOTSTXT_OBEY": False,
        "COOKIES_ENABLED": False,
        "DOWNLOAD_DELAY": 0,
        "RETRY_ENABLED": True,
        "RETRY_TIMES": 2,
    }

    def __init__(
        self,
        target_url: str,
        selectors: dict[str, SelectorConfig],
        results_store: list,
        errors_store: list,
        user_agent: str,
        *args: Any,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.start_urls = [target_url]
        self.target_url = target_url
        self.selectors = selectors
        self.results_store = results_store
        self.errors_store = errors_store
        self.user_agent = user_agent

    def start_requests(self):
        yield scrapy.Request(
            url=self.start_urls[0],
            callback=self.parse,
            errback=self.handle_error,
            headers={"User-Agent": self.user_agent},
            dont_filter=True,
        )

    def handle_error(self, failure):
        self.errors_store.append(str(failure.getErrorMessage()))

    def parse(self, response: ScrapyResponse):  # type: ignore[override]
        item: dict[str, Any] = {
            "_status_code": response.status,
            "_url": response.url,
        }

        for field_name, config in self.selectors.items():
            elements = response.css(config.selector)
            match_count = len(elements)

            if match_count == 0:
                item[field_name] = SelectorResult(
                    selector=config.selector,
                    attribute=config.attribute,
                    multiple=config.multiple,
                    value=None,
                    match_count=0,
                )
                continue

            def _extract(el, cfg=config) -> str:
                if cfg.attribute:
                    return el.attrib.get(cfg.attribute, "") or ""
                return el.css("::text").get(default="") or el.get() or ""

            if config.multiple:
                value: str | list[str] | None = [_extract(el) for el in elements]
            else:
                value = _extract(elements[0])

            item[field_name] = SelectorResult(
                selector=config.selector,
                attribute=config.attribute,
                multiple=config.multiple,
                value=value,
                match_count=match_count,
            )

        self.results_store.append(item)
        yield item


# ---------------------------------------------------------------------------
# Worker function — corre dentro del subproceso aislado
# ---------------------------------------------------------------------------

def _worker(
    url: str,
    selectors: dict[str, SelectorConfig],
    user_agent: str,
    timeout_s: float,
    queue: multiprocessing.Queue,
) -> None:
    """
    Punto de entrada del subproceso.  Configura el CrawlerProcess, lanza
    el spider y envía ``(results, errors)`` a través de la Queue.

    El subproceso tiene su propio espacio de memoria → reactor Twisted virgen
    → no hay ``ReactorNotRestartable`` sin importar cuántas veces se llame.
    """
    results_store: list[dict] = []
    errors_store: list[str] = []

    try:
        scrapy_settings = get_project_settings()
        scrapy_settings.setdict(
            {
                "LOG_ENABLED": False,
                "ROBOTSTXT_OBEY": False,
                "COOKIES_ENABLED": False,
                "DOWNLOAD_TIMEOUT": int(timeout_s),
                "USER_AGENT": user_agent,
                "DUPEFILTER_CLASS": "scrapy.dupefilters.BaseDupeFilter",
                "RETRY_ENABLED": True,
                "RETRY_TIMES": 2,
                "DNSCACHE_ENABLED": True,
            },
            priority="cmdline",
        )

        process = CrawlerProcess(scrapy_settings)
        process.crawl(
            GenericSpider,
            target_url=url,
            selectors=selectors,
            results_store=results_store,
            errors_store=errors_store,
            user_agent=user_agent,
        )
        # Bloquea hasta que el spider termine — OK porque estamos en un subproceso.
        process.start(stop_after_crawl=True)

        queue.put(("ok", results_store, errors_store))

    except Exception as exc:  # noqa: BLE001
        queue.put(("error", str(exc), []))


# ---------------------------------------------------------------------------
# Función puente — corre en un hilo para no bloquear el event-loop de asyncio
# ---------------------------------------------------------------------------

def _run_spider_in_subprocess(
    url: str,
    selectors: dict[str, SelectorConfig],
    user_agent: str,
    timeout_s: float,
) -> tuple[list[dict], list[str]]:
    """
    Lanza un subproceso (spawn) que ejecuta el spider, espera a que termine
    respetando ``timeout_s`` y devuelve ``(results, errors)``.

    Esta función es BLOQUEANTE; llámala siempre desde ``asyncio.to_thread``.

    Raises:
        TimeoutError: si el subproceso tarda más de ``timeout_s`` segundos.
        RuntimeError: si el worker reporta un error interno.
    """
    # «spawn» garantiza un proceso limpio incluso en Linux (donde fork es el default).
    ctx = multiprocessing.get_context("spawn")
    queue: multiprocessing.Queue = ctx.Queue()

    proc = ctx.Process(
        target=_worker,
        args=(url, selectors, user_agent, timeout_s, queue),
        daemon=True,          # muere automáticamente si el proceso padre muere
    )
    proc.start()
    proc.join(timeout=timeout_s)

    if proc.is_alive():
        # El subproceso tardó demasiado → lo terminamos para evitar huérfanos.
        proc.terminate()
        proc.join(timeout=5)          # gracia para cleanup
        if proc.is_alive():
            proc.kill()
        raise TimeoutError(
            f"El subproceso de Scrapy superó el timeout de {timeout_s}s para {url}",
            url=url,
        )

    if queue.empty():
        raise RuntimeError(
            f"El subproceso de Scrapy terminó sin enviar resultados para {url}"
        )

    payload = queue.get_nowait()
    status, *rest = payload

    if status == "error":
        error_msg = rest[0]
        raise RuntimeError(error_msg)

    results_store, errors_store = rest
    return results_store, errors_store


# ---------------------------------------------------------------------------
# ScrapyScraper — el engine registrado en la fábrica
# ---------------------------------------------------------------------------

class ScrapyScraper(BaseScraper):
    """
    Concrete scraping engine powered by Scrapy.

    Cada petición lanza un ``multiprocessing.Process`` con contexto «spawn»,
    lo que garantiza un reactor de Twisted completamente nuevo y elimina el
    error ``ReactorNotRestartable`` que se producía en la segunda petición.
    """

    engine_name = "scrapy"

    async def scrape(self, request: ScrapeRequest) -> ScrapeResponse:
        url = str(request.url)
        user_agent = get_random_user_agent()
        # Scrapy tiene sus propios reintentos; damos margen extra sobre el timeout declarado.
        timeout = (request.timeout or 30.0) + 10.0

        log.info(
            "[Scrapy] Scraping iniciado",
            extra={
                "url": url,
                "engine": self.engine_name,
                "selectors": list(request.selectors.keys()),
                "timeout": timeout,
                "user_agent": user_agent[:40] + "…",
            },
        )

        t0 = time.perf_counter()

        try:
            # asyncio.to_thread delega la función bloqueante a un hilo del pool
            # estándar, liberando el event-loop de FastAPI durante la espera.
            results_store, errors_store = await asyncio.wait_for(
                asyncio.to_thread(
                    _run_spider_in_subprocess,
                    url,
                    request.selectors,
                    user_agent,
                    timeout,
                ),
                timeout=timeout,
            )

        except asyncio.TimeoutError as exc:
            raise TimeoutError(
                f"Scrapy spider superó el timeout de {timeout}s para {url}",
                url=url,
            ) from exc

        except TimeoutError:
            # Re-raise TimeoutError propio (lanzado por _run_spider_in_subprocess)
            raise

        except Exception as exc:
            err_msg = str(exc).lower()
            if any(k in err_msg for k in ("dns", "gaierror", "name or service", "nodename")):
                raise InvalidURLError(
                    f"No se pudo resolver el host de la URL: {url}", url=url
                ) from exc
            raise MaxRetriesExceededError(
                f"El spider de Scrapy falló para {url}: {exc}", url=url
            ) from exc

        elapsed_ms = (time.perf_counter() - t0) * 1000

        if errors_store:
            log.warning(
                "[Scrapy] El spider reportó errores durante la ejecución",
                extra={"url": url, "errors": errors_store},
            )

        if not results_store:
            detail = errors_store[0] if errors_store else "sin resultados"
            raise ParseError(
                f"Scrapy spider no retornó resultados para {url} — {detail}", url=url
            )

        raw_item = results_store[0]
        status_code: int = raw_item.pop("_status_code", 200)
        raw_item.pop("_url", None)

        data: dict[str, SelectorResult] = {
            k: v for k, v in raw_item.items() if isinstance(v, SelectorResult)
        }

        log.info(
            "[Scrapy] Scraping completado",
            extra={
                "url": url,
                "status_code": status_code,
                "elapsed_ms": round(elapsed_ms, 2),
                "fields_extracted": len(data),
            },
        )

        return ScrapeResponse(
            success=True,
            metadata=ScrapeMetadata(
                url=url,
                status_code=status_code,
                engine=self.engine_name,
                parser="css",
                elapsed_ms=round(elapsed_ms, 2),
                user_agent=user_agent,
            ),
            data=data,
        )
