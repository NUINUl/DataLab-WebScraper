/* ─────────────────────────────────────────────────────────────
   DataLab — Shared TypeScript Types
   ───────────────────────────────────────────────────────────── */

export type Engine = 'bs4' | 'scrapy'

export type BS4Mode = 'demo' | 'external'

export type PersistenceMode = 'cache' | 'local' | 'cloud'

// ── Scrapy presets ──────────────────────────────────────────
export interface ScrapyPreset {
  label: string
  url: string
  description: string
  selectors: Record<string, SelectorConfig>
}

// ── Selector shape matching the FastAPI backend ────────────
export interface SelectorConfig {
  selector: string
  attribute?: string | null
  multiple: boolean
}

// ── Scrape request payload ─────────────────────────────────
export interface ScrapeRequest {
  url: string
  selectors: Record<string, SelectorConfig>
  parser?: 'lxml' | 'html.parser' | 'html5lib'
  headers?: Record<string, string>
  timeout?: number
}

// ── Individual selector result ─────────────────────────────
export interface SelectorResult {
  selector: string
  attribute: string | null
  multiple: boolean
  value: string | string[] | null
  match_count: number
}

// ── Scrape response from the API ───────────────────────────
export interface ScrapeMetadata {
  url: string
  status_code: number
  engine: string
  parser: string
  elapsed_ms: number
  user_agent: string
}

export interface ScrapeResponse {
  success: boolean
  record_id: string | null
  metadata: ScrapeMetadata
  data: Record<string, SelectorResult>
}

// ── Local DB record (fake persistence) ────────────────────
export interface DbRecord {
  id: string
  timestamp: number
  engine: Engine
  response: ScrapeResponse
}
