import type { ScrapeRequest, ScrapeResponse } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

/* ── Generic scrape dispatcher ───────────────────────────── */
export async function scrapeWithEngine(
  engine: 'bs4' | 'scrapy',
  payload: ScrapeRequest,
): Promise<ScrapeResponse> {
  const endpoint = engine === 'bs4' ? '/scrape/bs4' : '/scrape/scrapy'

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(90_000), // 90 s hard limit on the client side
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    const message =
      typeof err.detail === 'string'
        ? err.detail
        : (err.detail?.message ?? `HTTP ${res.status}`)
    throw new Error(message)
  }

  return res.json() as Promise<ScrapeResponse>
}

/* ── Demo page payload (BS4 internal preset) ─────────────── */
export const DEMO_REQUEST: ScrapeRequest = {
  url: 'https://books.toscrape.com/',
  selectors: {
    titles: {
      selector: 'article.product_pod h3 a',
      attribute: 'title',
      multiple: true,
    },
    prices: {
      selector: 'article.product_pod p.price_color',
      multiple: true,
    },
    ratings: {
      selector: 'article.product_pod p.star-rating',
      attribute: 'class',
      multiple: true,
    },
  },
  parser: 'lxml',
  timeout: 30,
}
