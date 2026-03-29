"""
Domain exceptions for the scraping engine.
All custom exceptions inherit from ScrapingError so callers can catch
either the broad base class or specific sub-types.
"""
from __future__ import annotations


class ScrapingError(Exception):
    """Root exception for all scraping-related errors."""

    def __init__(self, message: str, url: str | None = None) -> None:
        super().__init__(message)
        self.url = url
        self.message = message

    def __repr__(self) -> str:
        return f"{type(self).__name__}(message={self.message!r}, url={self.url!r})"


class InvalidURLError(ScrapingError):
    """Raised when the provided URL is not reachable or malformed."""


class HTTPError(ScrapingError):
    """Raised when the target server returns a non-2xx response."""

    def __init__(self, message: str, url: str | None = None, status_code: int | None = None) -> None:
        super().__init__(message, url)
        self.status_code = status_code


class TimeoutError(ScrapingError):
    """Raised when the HTTP request exceeds the configured timeout."""


class ParseError(ScrapingError):
    """Raised when the HTML parser cannot process the response body."""


class SelectorNotFoundError(ScrapingError):
    """Raised when no element matches the supplied CSS selector."""

    def __init__(self, message: str, url: str | None = None, selector: str | None = None) -> None:
        super().__init__(message, url)
        self.selector = selector


class MaxRetriesExceededError(ScrapingError):
    """Raised when all retry attempts have been exhausted."""
