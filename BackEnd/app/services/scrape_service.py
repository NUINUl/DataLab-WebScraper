"""
Service for persisting scraped data to MongoDB.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
import json

from app.core.database import get_database
from app.schemas.scrape import ScrapeResponse

log = logging.getLogger(__name__)

async def save_scrape_result(response: ScrapeResponse) -> str | None:
    """
    Saves a ScrapeResponse to the 'scraped_data' collection in MongoDB.
    
    Adds a UTC timestamp. Fails silently if the DB is unavailable.
    
    Returns:
        The stringified ObjectId if successful, or None if it failed.
    """
    db = get_database()
    if db is None:
        log.warning("[DB] Cannot save scrape result: Database not connected. Scrape data will be returned without persisting.")
        print("[DB-DEBUG] Database not connected — skipping save.")
        return None

    try:
        doc = response.model_dump(mode='json')
        doc["scraped_at"] = datetime.now(timezone.utc)

        collection = db["scraped_data"]

        print(f"[DB-DEBUG] Attempting to save result to MongoDB (url={response.metadata.url})...")
        log.info("[DB] Saving result to MongoDB", extra={"url": response.metadata.url})

        # Explicit 5 s timeout: if Atlas takes longer, we return the scrape data anyway.
        result = await asyncio.wait_for(
            collection.insert_one(doc),
            timeout=5.0,
        )

        record_id = str(result.inserted_id)
        print(f"[DB-DEBUG] ✅ Save successful — record_id={record_id}")
        log.info(f"[DB] Scraped data saved successfully to MongoDB with ID: {record_id}")
        return record_id

    except asyncio.TimeoutError:
        log.error("[DB] MongoDB insert timed out after 5 s — returning data without persisting.")
        print("[DB-DEBUG] ⚠️  Timeout inserting into MongoDB — scrape data is returned anyway.")
        return None
    except Exception as e:
        log.error(f"[DB] Error saving to MongoDB: {e}")
        print(f"[DB-DEBUG] ❌ Error saving to MongoDB: {e}")
        return None
