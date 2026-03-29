"""
FastAPI router for all scraping endpoints (multi-engine).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from app.core.exceptions import (
    HTTPError,
    InvalidURLError,
    MaxRetriesExceededError,
    ParseError,
    ScrapingError,
    SelectorNotFoundError,
    TimeoutError,
)
from app.scrapers.factory import ScraperFactory
from app.schemas.scrape import ScrapeRequest, ScrapeResponse
from app.services.scrape_service import save_scrape_result

log = logging.getLogger(__name__)

router = APIRouter(prefix="/scrape", tags=["Scraping"])


@router.post(
    "/bs4",
    response_model=ScrapeResponse,
    status_code=status.HTTP_200_OK,
    summary="Scrape a URL with BeautifulSoup4",
    description=(
        "Fetches the target URL using an HTTPX async client, parses the HTML "
        "with BeautifulSoup4, and extracts data according to the provided CSS selectors. "
        "Supports attribute extraction, single/multiple match modes, and custom headers."
    ),
)
async def scrape_bs4(payload: ScrapeRequest) -> ScrapeResponse:
    """
    **Request body fields**

    | Field | Type | Description |
    |---|---|---|
    | `url` | string (HttpUrl) | Target URL to scrape |
    | `selectors` | dict | Mapping of `field_name → SelectorConfig` |
    | `parser` | string | BS4 parser: `lxml` (default), `html.parser`, `html5lib` |
    | `headers` | dict | Optional extra HTTP headers |
    | `timeout` | float | Per-request timeout override (1–120 s) |

    **SelectorConfig fields**

    | Field | Type | Description |
    |---|---|---|
    | `selector` | string | CSS selector |
    | `attribute` | string \\| null | HTML attribute to extract; `null` → text content |
    | `multiple` | bool | Return all matches (list) vs. first match only |
    """
    scraper = ScraperFactory.get("bs4")

    try:
        response = await scraper.scrape(payload)

        if response.success:
            record_id = await save_scrape_result(response)
            response.record_id = record_id

        return response

    except (TimeoutError, InvalidURLError, HTTPError, SelectorNotFoundError,
            ParseError, MaxRetriesExceededError, ScrapingError) as exc:
        raise _to_http_exception(exc) from exc


# ---------------------------------------------------------------------------
# /scrapy — Scrapy engine
# ---------------------------------------------------------------------------

@router.post(
    "/scrapy",
    response_model=ScrapeResponse,
    status_code=status.HTTP_200_OK,
    summary="Scrape a URL with Scrapy",
    description=(
        "Fetches the target URL using a Scrapy CrawlerRunner running inside "
        "the FastAPI asyncio event loop. Applies CSS selectors via Scrapy's "
        "built-in response.css() and returns a ScrapeResponse identical in "
        "structure to the bs4 endpoint."
    ),
)
async def scrape_scrapy(payload: ScrapeRequest) -> ScrapeResponse:
    scraper = ScraperFactory.get("scrapy")

    try:
        response = await scraper.scrape(payload)

        if response.success:
            record_id = await save_scrape_result(response)
            response.record_id = record_id

        return response

    except (TimeoutError, InvalidURLError, HTTPError, SelectorNotFoundError,
            ParseError, MaxRetriesExceededError, ScrapingError) as exc:
        raise _to_http_exception(exc) from exc


# ---------------------------------------------------------------------------
# Shared error mapper
# ---------------------------------------------------------------------------

def _to_http_exception(exc: Exception) -> HTTPException:
    """Map domain exceptions to FastAPI HTTPException."""
    if isinstance(exc, TimeoutError):
        return HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail={"error": "timeout", "message": exc.message, "url": exc.url},
        )
    if isinstance(exc, InvalidURLError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_url", "message": exc.message, "url": exc.url},
        )
    if isinstance(exc, HTTPError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "http_error",
                "message": exc.message,
                "url": exc.url,
                "upstream_status": exc.status_code,
            },
        )
    if isinstance(exc, SelectorNotFoundError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "selector_not_found",
                "message": exc.message,
                "url": exc.url,
                "selector": exc.selector,
            },
        )
    if isinstance(exc, ParseError):
        return HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error": "parse_error", "message": exc.message, "url": exc.url},
        )
    if isinstance(exc, MaxRetriesExceededError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "max_retries_exceeded", "message": exc.message, "url": exc.url},
        )
    # ScrapingError catch-all
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={"error": "scraping_error", "message": getattr(exc, "message", str(exc))},
    )
