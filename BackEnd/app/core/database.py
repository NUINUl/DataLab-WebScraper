"""
MongoDB database connection manager.
Provides a singleton Motor client that should be initialized at application startup
and closed at shutdown.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ServerSelectionTimeoutError

from app.core.config import settings

log = logging.getLogger(__name__)

# Global client instance
_client: Optional[AsyncIOMotorClient] = None

async def connect_db() -> None:
    """Initialize the MongoDB connection pool."""
    global _client
    if _client is not None:
        return

    try:
        log.info(f"Connecting to MongoDB at {settings.mongodb_uri.split('@')[-1][:15]}...")
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=8000,
            uuidRepresentation="standard",
        )
        # Ping with explicit asyncio timeout to avoid blocking startup for more than 8s
        await asyncio.wait_for(
            _client.admin.command("ping"),
            timeout=8.0,
        )
        log.info("Successfully connected to MongoDB.")
    except asyncio.TimeoutError:
        log.error("MongoDB ping timed out after 8 s — DB unavailable, continuing without persistence.")
        _client = None
    except Exception as e:
        log.error(f"Failed to connect to MongoDB: {e}")
        _client = None

async def close_db() -> None:
    """Close the MongoDB connection pool."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
        log.info("MongoDB connection closed.")

def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Retrieve the configured MongoDB database instance."""
    if _client is None:
        return None
    return _client[settings.mongodb_db_name]

def is_db_connected() -> bool:
    """Check if the DB client is initialized."""
    return _client is not None
