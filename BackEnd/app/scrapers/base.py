"""
Abstract base class for all scraping engine implementations.

Every engine MUST implement ``scrape()``.  The factory pattern lives in
``app.scrapers.factory`` and returns the correct concrete class at runtime.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from app.schemas.scrape import ScrapeRequest, ScrapeResponse


class BaseScraper(ABC):
    """
    Contract that every scraping engine must satisfy.

    Concrete scrapers (BS4Scraper, PlaywrightScraper, …) inherit from this
    class and implement the ``scrape`` method.  They should NOT share
    HTTP-client state between requests; each call to ``scrape`` is
    independently self-contained.

    Usage::

        scraper = ScraperFactory.get("bs4")
        response = await scraper.scrape(request)
    """

    # Human-readable identifier used in response metadata and factory lookups.
    engine_name: str = "base"

    @abstractmethod
    async def scrape(self, request: ScrapeRequest) -> ScrapeResponse:
        """
        Fetch *request.url* and extract data according to *request.selectors*.

        Parameters
        ----------
        request:
            Validated ``ScrapeRequest`` instance produced by the API layer.

        Returns
        -------
        ScrapeResponse
            Fully populated, structured response.

        Raises
        ------
        InvalidURLError
            The URL is unreachable or could not be resolved.
        HTTPError
            The server returned a non-2xx status code.
        TimeoutError
            The request exceeded the configured timeout.
        ParseError
            The response body could not be parsed as HTML.
        SelectorNotFoundError
            None of the provided selectors matched any element.
        MaxRetriesExceededError
            All retry attempts failed.
        """
        ...

    def __repr__(self) -> str:
        return f"{type(self).__name__}(engine={self.engine_name!r})"
