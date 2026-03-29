"""
BeautifulSoup4 scraping engine.

Responsibilities
----------------
1. Build an HTTPX async client with UA rotation and caller-supplied headers.
2. Fetch the target URL with configurable timeout and automatic retries
   (via tenacity) for transient network errors.
3. Parse the HTML response using the requested BS4 parser backend.
4. Apply each CSS selector rule and collect results into a ``ScrapeResponse``.
5. Map all known error conditions to the domain exception hierarchy.
"""
from __future__ import annotations

import asyncio
import time
import logging
from typing import Any

import httpx
from bs4 import BeautifulSoup, Tag
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.core.config import settings
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

# Errors that are worth retrying (transient network issues)
_RETRYABLE = (
    httpx.TimeoutException,
    httpx.NetworkError,
    httpx.RemoteProtocolError,
)


class BS4Scraper(BaseScraper):
    """
    Concrete scraping engine powered by ``httpx`` + ``BeautifulSoup4``.

    Thread / concurrency model
    --------------------------
    A **new** ``httpx.AsyncClient`` is created per ``scrape()`` call so that
    callers can run multiple requests concurrently without sharing state.
    """

    engine_name = "bs4"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def scrape(self, request: ScrapeRequest) -> ScrapeResponse:
        url = str(request.url)
        user_agent = get_random_user_agent()
        timeout = request.timeout or settings.http_timeout_total

        log.info(
            "Scraping started",
            extra={
                "url": url,
                "engine": self.engine_name,
                "parser": request.parser.value,
                "selectors": list(request.selectors.keys()),
                "user_agent": user_agent[:40] + "…",
            },
        )

        t0 = time.perf_counter()
        html, status_code = await self._fetch_with_retry(
            url=url,
            user_agent=user_agent,
            extra_headers=request.headers,
            timeout=timeout,
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000

        soup = self._parse_html(html, request.parser.value, url)
        data = self._extract_selectors(soup, request.selectors, url, raw_html=html)

        log.info(
            "Scraping completed",
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
                parser=request.parser.value,
                elapsed_ms=round(elapsed_ms, 2),
                user_agent=user_agent,
            ),
            data=data,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _fetch_with_retry(
        self,
        url: str,
        user_agent: str,
        extra_headers: dict[str, str],
        timeout: float,
    ) -> tuple[str, int]:
        """Fetch ``url`` with exponential back-off retry on transient errors."""

        headers = self._build_headers(user_agent, extra_headers)

        # ── CAMBIO 2: timeout de conexión elevado a 20 s para entornos lentos ──
        httpx_timeout = httpx.Timeout(
            connect=20.0,
            read=settings.http_timeout_read,
            write=10.0,
            pool=5.0,
        )

        last_exc: Exception | None = None

        try:
            async for attempt in AsyncRetrying(
                stop=stop_after_attempt(settings.retry_max_attempts),
                wait=wait_exponential(
                    min=settings.retry_wait_min,
                    max=settings.retry_wait_max,
                ),
                retry=retry_if_exception_type(_RETRYABLE),
                reraise=False,
            ):
                with attempt:
                    try:
                        # SSL disabled for development environments ──
                        async with httpx.AsyncClient(
                            headers=headers,
                            timeout=httpx_timeout,
                            max_redirects=settings.http_max_redirects,
                            verify=False,   # dev-mode: ignore SSL certificates
                            follow_redirects=True,
                        ) as client:
                            response = await client.get(url)

                    except httpx.TimeoutException as exc:
                        log.warning("Request timed out", extra={"url": url, "attempt": attempt.retry_state.attempt_number})
                        last_exc = exc
                        raise  # let tenacity handle retry

                    except httpx.InvalidURL as exc:
                        raise InvalidURLError(f"Invalid URL: {exc}", url=url) from exc

                    except httpx.NetworkError as exc:
                        log.warning("Network error", extra={"url": url, "error": str(exc)})
                        last_exc = exc
                        raise

                    except httpx.HTTPStatusError as exc:
                        raise HTTPError(
                            f"HTTP {exc.response.status_code} from {url}",
                            url=url,
                            status_code=exc.response.status_code,
                        ) from exc

                    # Non-retryable HTTP errors (4xx / 5xx)
                    try:
                        response.raise_for_status()
                    except httpx.HTTPStatusError as exc:
                        raise HTTPError(
                            f"HTTP {exc.response.status_code} from {url}",
                            url=url,
                            status_code=exc.response.status_code,
                        ) from exc

                    return response.text, response.status_code

        except MaxRetriesExceededError:
            raise
        except (InvalidURLError, HTTPError, ParseError):
            raise
        except Exception as exc:
            # Tenacity exhausted all retries on a retryable error
            raise MaxRetriesExceededError(
                f"All {settings.retry_max_attempts} retry attempts failed for {url}. "
                f"Last error: {exc}",
                url=url,
            ) from exc

        # Should never reach here, but satisfies type-checker
        raise MaxRetriesExceededError(f"Unexpected exit from retry loop for {url}", url=url)

    @staticmethod
    def _build_headers(user_agent: str, extra: dict[str, str]) -> dict[str, str]:
        defaults: dict[str, str] = {
            "User-Agent": user_agent,
            "Accept": (
                "text/html,application/xhtml+xml,application/xml;"
                "q=0.9,image/avif,image/webp,*/*;q=0.8"
            ),
            "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        # Caller-supplied headers take precedence
        return {**defaults, **extra}

    @staticmethod
    def _parse_html(html: str, parser: str, url: str) -> BeautifulSoup:
        """
        Parse *html* with *parser*.

        Parser fallback:
        If the requested parser is ``lxml`` and raises an exception (not installed
        or corrupted document), it will automatically retry with the native
        Python ``html.parser`` before propagating the error.
        """
        _FALLBACK_PARSER = "html.parser"

        def _try_parse(p: str) -> BeautifulSoup:
            soup = BeautifulSoup(html, p)
            if soup.find("html") is None and len(html) > 500:
                log.warning(
                    "Parser returned empty <html> tag",
                    extra={"url": url, "parser": p},
                )
            return soup

        try:
            return _try_parse(parser)
        except Exception as primary_exc:
            if parser != _FALLBACK_PARSER:
                log.warning(
                    "Parser failed, retrying with fallback",
                    extra={
                        "url": url,
                        "failed_parser": parser,
                        "fallback_parser": _FALLBACK_PARSER,
                        "error": str(primary_exc),
                    },
                )
                try:
                    return _try_parse(_FALLBACK_PARSER)
                except Exception as fallback_exc:
                    raise ParseError(
                        f"Both '{parser}' and '{_FALLBACK_PARSER}' failed: {fallback_exc}",
                        url=url,
                    ) from fallback_exc
            raise ParseError(f"Failed to parse HTML: {primary_exc}", url=url) from primary_exc

    @staticmethod
    def _extract_selectors(
        soup: BeautifulSoup,
        selectors: dict[str, SelectorConfig],
        url: str,
        raw_html: str = "",  # receives raw HTML for diagnostics
    ) -> dict[str, SelectorResult]:
        results: dict[str, SelectorResult] = {}
        _any_matched = False

        for field_name, config in selectors.items():
            elements: list[Any] = soup.select(config.selector)
            match_count = len(elements)

            if match_count == 0:
                log.warning(
                    "Selector matched no elements",
                    extra={"url": url, "field": field_name, "selector": config.selector},
                )
                results[field_name] = SelectorResult(
                    selector=config.selector,
                    attribute=config.attribute,
                    multiple=config.multiple,
                    value=None,
                    match_count=0,
                )
                continue

            _any_matched = True

            def _extract_value(el: Tag) -> str:
                if config.attribute:
                    return el.get(config.attribute, "") or ""
                return el.get_text(strip=True)

            if config.multiple:
                value: str | list[str] | None = [_extract_value(el) for el in elements]
            else:
                value = _extract_value(elements[0])

            results[field_name] = SelectorResult(
                selector=config.selector,
                attribute=config.attribute,
                multiple=config.multiple,
                value=value,
                match_count=match_count,
            )

        # Raw HTML — diagnosis of hidden 'Access Denied' ──
        # If NONE of the selectors found anything, we print the start of the HTML
        # to detect blocking pages disguised as 200 OK.
        if not _any_matched and raw_html:
            snippet = raw_html[:500].replace("\n", " ").replace("\r", "")
            log.warning(
                "[DIAGNOSIS] No selector matched. First 500 characters of HTML:",
                extra={"url": url, "html_snippet": snippet},
            )
            # Also to stdout for direct console visibility
            print(
                f"\n{'='*70}\n"
                f"[BS4-DEBUG] URL: {url}\n"
                f"[BS4-DEBUG] HTML snippet (500 chars):\n{snippet}\n"
                f"{'='*70}\n"
            )

        return results
