'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Engine,
  BS4Mode,
  DbRecord,
  ScrapeResponse,
  ScrapyPreset,
  PersistenceMode,
} from '@/types'

/* ── Preset catalogue ────────────────────────────────────── */
export const SCRAPY_PRESETS: ScrapyPreset[] = [
  {
    label: 'Books',
    url: 'https://books.toscrape.com/',
    description: 'Book catalogue — titles & prices',
    selectors: {
      titles: { selector: 'article.product_pod h3 a', attribute: 'title', multiple: true },
      prices: { selector: 'article.product_pod p.price_color', multiple: true },
    },
  },
  {
    label: 'HackerNews',
    url: 'https://news.ycombinator.com/',
    description: 'Top HN stories',
    selectors: {
      titles: { selector: '.titleline > a', multiple: true },
      scores: { selector: '.score', multiple: true },
    },
  },
  {
    label: 'Quotes',
    url: 'https://quotes.toscrape.com/',
    description: 'Famous quotes & authors',
    selectors: {
      quotes:  { selector: '.quote .text', multiple: true },
      authors: { selector: '.quote .author', multiple: true },
    },
  },
  {
    label: 'PythonDocs',
    url: 'https://docs.python.org/3/',
    description: 'Python docs nav links',
    selectors: {
      sections: { selector: '.toctree-wrapper li a', multiple: true },
    },
  },
]

/* ── Store Shape ─────────────────────────────────────────── */
interface DataLabState {
  /* Engine selection */
  engine: Engine
  setEngine: (e: Engine) => void

  /* BS4 sub-mode */
  bs4Mode: BS4Mode
  setBs4Mode: (m: BS4Mode) => void

  /* Scrapy URL input & presets */
  scrapyUrl: string
  setScrapyUrl: (url: string) => void
  activePreset: ScrapyPreset | null
  setActivePreset: (p: ScrapyPreset | null) => void

  /* BS4 external URL */
  bs4ExternalUrl: string
  setBs4ExternalUrl: (url: string) => void

  /* Loading / error state */
  isLoading: boolean
  setIsLoading: (v: boolean) => void
  error: string | null
  setError: (e: string | null) => void

  /* Latest scrape result */
  latestResponse: ScrapeResponse | null
  setLatestResponse: (r: ScrapeResponse | null) => void

  /* Fake DB — local persistence */
  records: DbRecord[]
  addRecord: (engine: Engine, response: ScrapeResponse) => void
  clearRecords: () => void

  /* Panel — which record is displayed */
  selectedRecordId: string | null
  setSelectedRecordId: (id: string | null) => void

  /* Persistence strategy */
  persistenceMode: PersistenceMode
  setPersistenceMode: (m: PersistenceMode) => void
  downloadJson: () => void
}

/* ── Store ───────────────────────────────────────────────── */
export const useDataLabStore = create<DataLabState>()(
  persist(
    (set, get) => ({
      engine: 'bs4',
      setEngine: (engine) => set({ engine, error: null }),

      bs4Mode: 'demo',
      setBs4Mode: (bs4Mode) => set({ bs4Mode }),

      scrapyUrl: '',
      setScrapyUrl: (scrapyUrl) => set({ scrapyUrl, activePreset: null }),
      activePreset: SCRAPY_PRESETS[0],
      setActivePreset: (activePreset) =>
        set({ activePreset, scrapyUrl: activePreset?.url ?? '' }),

      bs4ExternalUrl: '',
      setBs4ExternalUrl: (bs4ExternalUrl) => set({ bs4ExternalUrl }),

      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      error: null,
      setError: (error) => set({ error }),

      latestResponse: null,
      setLatestResponse: (latestResponse) => set({ latestResponse }),

      records: [],
      addRecord: (engine, response) => {
        const record: DbRecord = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          engine,
          response,
        }
        set((s) => ({
          records: [record, ...s.records].slice(0, 50), // keep latest 50
          selectedRecordId: record.id,
          latestResponse: response,
        }))
      },
      clearRecords: () => set({ records: [], selectedRecordId: null, latestResponse: null }),

      selectedRecordId: null,
      setSelectedRecordId: (selectedRecordId) => set({ selectedRecordId }),

      persistenceMode: 'cache',
      setPersistenceMode: (persistenceMode) => set({ persistenceMode }),
      downloadJson: () => {
        const { records } = get()
        if (!records.length) return
        const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `datalab-records-${Date.now()}.json`
        a.click()
        URL.revokeObjectURL(url)
      },
    }),
    {
      name: 'datalab-store',
      partialize: (s) => ({
        records: s.records,
        selectedRecordId: s.selectedRecordId,
        engine: s.engine,
        bs4Mode: s.bs4Mode,
        scrapyUrl: s.scrapyUrl,
        bs4ExternalUrl: s.bs4ExternalUrl,
        persistenceMode: s.persistenceMode,
      }),
    },
  ),
)
