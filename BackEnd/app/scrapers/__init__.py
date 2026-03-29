# scrapers package
from app.scrapers.base import BaseScraper
from app.scrapers.bs4.engine import BS4Scraper
from app.scrapers.factory import ScraperFactory

__all__ = ["BaseScraper", "BS4Scraper", "ScraperFactory"]
