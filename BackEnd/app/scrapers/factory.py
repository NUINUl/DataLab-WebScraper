"""
Scraper Factory — resolves engine name → concrete BaseScraper subclass.

Adding a new engine only requires registering it in ``_REGISTRY``.
"""
from __future__ import annotations

from app.scrapers.base import BaseScraper
from app.scrapers.bs4.engine import BS4Scraper
from app.scrapers.scrapy.engine import ScrapyScraper

_REGISTRY: dict[str, type[BaseScraper]] = {
    "bs4": BS4Scraper,
    "scrapy": ScrapyScraper,
    # Future engines:
    # "playwright": PlaywrightScraper,
    # "selenium":   SeleniumScraper,
}


class ScraperFactory:
    """
    Factory that instantiates the correct scraping engine by key.

    Usage::

        scraper = ScraperFactory.get("bs4")
        response = await scraper.scrape(request)
    """

    @classmethod
    def get(cls, engine: str) -> BaseScraper:
        """
        Return a new instance of the requested engine.

        Parameters
        ----------
        engine:
            Case-insensitive engine identifier (e.g. ``"bs4"``).

        Raises
        ------
        ValueError
            The requested engine is not registered.
        """
        key = engine.lower()
        scraper_cls = _REGISTRY.get(key)
        if scraper_cls is None:
            available = ", ".join(sorted(_REGISTRY))
            raise ValueError(
                f"Unknown scraping engine '{engine}'. "
                f"Available engines: [{available}]"
            )
        return scraper_cls()

    @classmethod
    def available_engines(cls) -> list[str]:
        """Return sorted list of registered engine keys."""
        return sorted(_REGISTRY)
