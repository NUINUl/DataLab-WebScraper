"""
Pydantic schemas for the /scrape/bs4 endpoint.
Input validation enforces URL format and non-empty selectors.
Output is always structured and typed.
"""
from __future__ import annotations

from enum import Enum
from typing import Annotated

from pydantic import AnyHttpUrl, BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Shared / Enums
# ---------------------------------------------------------------------------

class BS4Parser(str, Enum):
    """Parsers supported by BeautifulSoup4."""
    lxml = "lxml"
    html_parser = "html.parser"
    html5lib = "html5lib"


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SelectorConfig(BaseModel):
    """Configuration for a single CSS selector extraction rule."""

    selector: Annotated[str, Field(min_length=1, description="CSS selector string")]
    attribute: str | None = Field(
        default=None,
        description=(
            "HTML attribute to extract (e.g. 'href', 'src'). "
            "When None the element's text content is returned."
        ),
    )
    multiple: bool = Field(
        default=False,
        description="Return all matches (list) instead of only the first.",
    )

    @field_validator("selector")
    @classmethod
    def selector_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("selector must not be blank")
        return v.strip()


class ScrapeRequest(BaseModel):
    """Incoming payload for the BS4 scraping endpoint."""

    url: AnyHttpUrl = Field(description="Target URL to scrape.")
    selectors: Annotated[
        dict[str, SelectorConfig],
        Field(min_length=1, description="Mapping of field_name → SelectorConfig."),
    ]
    parser: BS4Parser = Field(
        default=BS4Parser.lxml,
        description="BeautifulSoup4 parser backend.",
    )
    headers: dict[str, str] = Field(
        default_factory=dict,
        description="Optional extra HTTP headers merged with defaults.",
    )
    timeout: float | None = Field(
        default=None,
        ge=1.0,
        le=120.0,
        description="Per-request timeout in seconds (overrides global setting).",
    )

    model_config = {"json_schema_extra": {
        "examples": [
            {
                "url": "https://books.toscrape.com/",
                "selectors": {
                    "titles": {
                        "selector": "article.product_pod h3 a",
                        "attribute": "title",
                        "multiple": True,
                    },
                    "prices": {
                        "selector": "article.product_pod p.price_color",
                        "multiple": True,
                    },
                },
                "parser": "lxml",
            }
        ]
    }}


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class SelectorResult(BaseModel):
    """Result for a single selector extraction."""

    selector: str
    attribute: str | None
    multiple: bool
    value: str | list[str] | None = Field(
        description="Extracted text/attribute value. None if selector matched nothing.",
    )
    match_count: int = Field(description="Number of DOM elements matched.")


class ScrapeMetadata(BaseModel):
    """Request-level metadata attached to every response."""

    url: str
    status_code: int
    engine: str = "bs4"
    parser: str
    elapsed_ms: float
    user_agent: str


class ScrapeResponse(BaseModel):
    """Structured response returned by the BS4 scraping endpoint."""

    success: bool
    record_id: str | None = Field(default=None, description="MongoDB object ID if saved successfully.")
    metadata: ScrapeMetadata
    data: dict[str, SelectorResult]
