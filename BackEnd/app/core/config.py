# ---------------------------------------------------------
#  [!] PROJECT: DataLab
#  [!] ARCHITECT: NUINUI
#  [!] VERSION: 0.1.0 (2026)
# ---------------------------------------------------------
"""
Application-wide configuration loaded from environment variables or .env file.
"""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # API metadata
    app_name: str = "BS4yScrappy"
    app_version: str = "0.1.0"
    debug: bool = False

    # HTTP client behaviour
    http_timeout_connect: float = 10.0   # seconds
    http_timeout_read: float = 30.0
    http_timeout_total: float = 60.0
    http_max_redirects: int = 10
    http_verify_ssl: bool = True

    # Retry policy
    retry_max_attempts: int = 3
    retry_wait_min: float = 1.0          # seconds
    retry_wait_max: float = 8.0

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"             # "json" | "text"

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "bs4yscrappy"


settings = Settings()
