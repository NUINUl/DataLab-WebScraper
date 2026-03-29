'use client'

import { motion } from 'motion/react'
import { Loader2, Zap, AlertCircle } from 'lucide-react'
import { useDataLabStore, SCRAPY_PRESETS } from '@/store/datalab'
import { scrapeWithEngine, DEMO_REQUEST } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ScrapeRequest } from '@/types'

export function ScrapeButton() {
  const {
    engine,
    bs4Mode,
    bs4ExternalUrl,
    scrapyUrl,
    activePreset,
    isLoading,
    error,
    persistenceMode,
    setIsLoading,
    setError,
    addRecord,
  } = useDataLabStore()

  const isScrapy = engine === 'scrapy'

  /* Validate inputs before sending */
  function buildRequest(): ScrapeRequest | null {
    if (isScrapy) {
      const url = (activePreset?.url ?? scrapyUrl).trim()
      if (!url) {
        setError('Please enter a URL or select a preset.')
        return null
      }
      return {
        url,
        selectors: activePreset?.selectors ?? {
          content: { selector: 'p', multiple: true },
        },
        timeout: 45,
      }
    } else {
      if (bs4Mode === 'demo') return DEMO_REQUEST
      const url = bs4ExternalUrl.trim()
      if (!url) {
        setError('Please enter a URL.')
        return null
      }
      return {
        url,
        selectors: {
          headings: { selector: 'h1, h2, h3', multiple: true },
          links:    { selector: 'a[href]', attribute: 'href', multiple: true },
          paragraphs: { selector: 'p', multiple: true },
        },
        parser: 'lxml',
        timeout: 30,
      }
    }
  }

  async function handleScrape() {
    setError(null)
    const req = buildRequest()
    if (!req) return

    setIsLoading(true)
    try {
      const response = await scrapeWithEngine(engine, req)
      // Always add to local store so DataMirror can display the result.
      // In 'cloud' mode the record_id from MongoDB will be present in the response.
      addRecord(engine, response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const accentGradient = isScrapy
    ? 'from-[oklch(0.50_0.24_248)] to-[oklch(0.62_0.20_220)]'
    : 'from-[oklch(0.54_0.22_162)] to-[oklch(0.66_0.18_140)]'

  const glowShadow = isScrapy
    ? '0 0 20px oklch(0.60_0.22_248/0.45), 0 4px 16px oklch(0_0_0/0.35)'
    : '0 0 20px oklch(0.65_0.20_162/0.45), 0 4px 16px oklch(0_0_0/0.35)'

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        id="scrape-button"
        onClick={handleScrape}
        disabled={isLoading}
        whileHover={isLoading ? {} : { scale: 1.02, y: -1 }}
        whileTap={isLoading ? {} : { scale: 0.97 }}
        style={isLoading ? {} : { boxShadow: glowShadow }}
        className={cn(
          'relative w-full flex items-center justify-center gap-2.5',
          'py-3.5 rounded-xl text-sm font-semibold text-white',
          'bg-gradient-to-r cursor-pointer',
          accentGradient,
          'transition-all duration-200',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100',
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Scraping{isScrapy ? ' with Scrapy' : ' with BS4'}…</span>
          </>
        ) : (
          <>
            <Zap className="size-4" />
            <span>
              Run Scrape
              <span className="ml-1.5 opacity-70 font-normal text-xs">
                ({isScrapy ? 'Scrapy' : 'BS4'})
              </span>
            </span>
          </>
        )}

        {/* Shimmer overlay on hover */}
        {!isLoading && (
          <motion.span
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        )}
      </motion.button>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn(
            'flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs',
            'bg-[oklch(0.75_0.18_0/0.08)] border border-[oklch(0.75_0.18_0/0.25)]',
            'text-[oklch(0.78_0.14_20)]',
          )}
        >
          <AlertCircle className="size-3.5 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </motion.div>
      )}
    </div>
  )
}
