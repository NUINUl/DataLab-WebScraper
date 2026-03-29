# ---------------------------------------------------------
#  [!] PROJECT: DataLab
#  [!] ARCHITECT: NUINUI
#  [!] VERSION: 0.1.0 (2026)
# ---------------------------------------------------------
"""
FastAPI application factory and lifecycle management.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.core.database import connect_db, close_db, is_db_connected
from app.scrapers.factory import ScraperFactory
from app.api.routes.scrape import router as scrape_router

log = get_logger(__name__)


# ---------------------------------------------------------------------------
# Application lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup / shutdown hooks."""
    setup_logging()
    log.info(
        "BS4yScrappy starting",
        extra={
            "version": settings.app_version,
            "debug": settings.debug,
            "engines": ScraperFactory.available_engines(),
        },
    )
    await connect_db()
    
    yield
    
    await close_db()
    log.info("BS4yScrappy shutdown complete")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "## Professional Multi-Engine Web Scraping API\n\n"
            "A modular scraping backend built with FastAPI and the **Factory Pattern**.\n\n"
            "### Current engines\n"
            "| Engine | Status | Description |\n"
            "|--------|--------|--------------|\n"
            "| `bs4`     | ✅ Active  | BeautifulSoup4 + HTTPX |\n"
            "| `scrapy`  | ✅ Active  | Scrapy + asyncio reactor |\n"
            "### Features\n"
            "- CSS selector-based extraction\n"
            "- Single / multiple element support\n"
            "- Attribute or text extraction\n"
            "- Automatic User-Agent rotation\n"
            "- Exponential back-off retry\n"
            "- Structured JSON responses\n"
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS — open to all origins (ideal for dev; restrict in prod)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(scrape_router, prefix="/api/v1")

    # Health-check endpoint
    @app.get("/health", tags=["System"], summary="Health check")
    async def health() -> JSONResponse:
        return JSONResponse(
            content={
                "status": "ok",
                "version": settings.app_version,
                "engines": ScraperFactory.available_engines(),
                "db": "connected" if is_db_connected() else "disconnected",
            }
        )

    return app


# ---------------------------------------------------------------------------
# Module-level app instance (used by uvicorn)
# ---------------------------------------------------------------------------

app = create_app()
