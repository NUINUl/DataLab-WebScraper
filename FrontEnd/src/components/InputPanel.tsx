'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Globe, FlaskConical, ChevronRight, X } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useDataLabStore, SCRAPY_PRESETS } from '@/store/datalab'
import { cn } from '@/lib/utils'
import type { ScrapyPreset } from '@/types'

/* ── Preset Chip ─────────────────────────────────────────── */
function PresetChip({
  preset,
  isActive,
  onClick,
}: {
  preset: ScrapyPreset
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Tooltip.Provider delayDuration={400}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.button
            onClick={onClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer',
              'transition-all duration-200 focus-visible:outline-2',
              isActive
                ? 'bg-[oklch(0.60_0.22_248/0.25)] border-[oklch(0.60_0.22_248/0.60)] text-[oklch(0.72_0.18_248)]'
                : 'bg-[oklch(1_0_0/0.04)] border-[oklch(1_0_0/0.10)] text-[oklch(0.65_0.01_260)] hover:border-[oklch(0.60_0.22_248/0.35)] hover:text-[oklch(0.80_0.01_260)]',
            )}
          >
            {preset.label}
          </motion.button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={6}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs',
              'bg-[oklch(0.15_0.018_260)] border border-[oklch(1_0_0/0.10)]',
              'text-[oklch(0.75_0.01_260)] shadow-xl',
              'animate-in fade-in-0 zoom-in-95 duration-150',
            )}
          >
            {preset.description}
            <Tooltip.Arrow className="fill-[oklch(0.15_0.018_260)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

/* ── Scrapy Panel ────────────────────────────────────────── */
function ScrapyInputPanel() {
  const { scrapyUrl, setScrapyUrl, activePreset, setActivePreset } = useDataLabStore()

  return (
    <motion.div
      key="scrapy-panel"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      {/* URL Input */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="scrapy-url-input"
          className="text-xs font-medium text-[oklch(0.55_0.01_260)] uppercase tracking-wider"
        >
          Target URL
        </label>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[oklch(0.45_0.01_260)]" />
          <input
            id="scrapy-url-input"
            type="url"
            value={scrapyUrl}
            onChange={(e) => setScrapyUrl(e.target.value)}
            placeholder="https://example.com"
            spellCheck={false}
            autoComplete="off"
            className={cn(
              'w-full pl-10 pr-10 py-3 rounded-xl text-sm',
              'bg-[oklch(1_0_0/0.04)] border border-[oklch(1_0_0/0.09)]',
              'text-[oklch(0.90_0.01_260)] placeholder:text-[oklch(0.40_0.01_260)]',
              'focus:outline-none focus:border-[oklch(0.60_0.22_248/0.60)]',
              'focus:bg-[oklch(0.60_0.22_248/0.06)] transition-all duration-200',
              'font-mono text-[0.82rem]',
            )}
          />
          {scrapyUrl && (
            <button
              onClick={() => setScrapyUrl('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.01_260)] hover:text-[oklch(0.70_0.01_260)] transition-colors"
              aria-label="Clear URL"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-[oklch(0.55_0.01_260)] uppercase tracking-wider">
          Quick Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {SCRAPY_PRESETS.map((preset) => (
            <PresetChip
              key={preset.label}
              preset={preset}
              isActive={activePreset?.label === preset.label}
              onClick={() =>
                activePreset?.label === preset.label
                  ? setActivePreset(null)
                  : setActivePreset(preset)
              }
            />
          ))}
        </div>
        {activePreset && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[0.72rem] text-[oklch(0.55_0.01_260)] leading-relaxed"
          >
            <ChevronRight className="inline size-3 mr-0.5 -mt-px text-[oklch(0.60_0.22_248)]" />
            {activePreset.description}
          </motion.p>
        )}
      </div>
    </motion.div>
  )
}

/* ── BS4 Panel ───────────────────────────────────────────── */
function BS4InputPanel() {
  const { bs4Mode, setBs4Mode, bs4ExternalUrl, setBs4ExternalUrl } =
    useDataLabStore()

  return (
    <motion.div
      key="bs4-panel"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex flex-col gap-5"
    >
      {/* Mode Toggle */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-[oklch(0.55_0.01_260)] uppercase tracking-wider">
          Data Source
        </span>
        <div
          role="group"
          aria-label="BS4 data source"
          className={cn(
            'flex rounded-xl overflow-hidden border border-[oklch(1_0_0/0.09)]',
            'bg-[oklch(1_0_0/0.03)]',
          )}
        >
          {(['demo', 'external'] as const).map((mode) => {
            const isActive = bs4Mode === mode
            return (
              <button
                key={mode}
                onClick={() => setBs4Mode(mode)}
                aria-pressed={isActive}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm',
                  'font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-[oklch(0.65_0.20_162/0.20)] text-[oklch(0.76_0.17_162)] border-b-2 border-[oklch(0.65_0.20_162/0.70)]'
                    : 'text-[oklch(0.55_0.01_260)] hover:text-[oklch(0.75_0.01_260)] hover:bg-[oklch(1_0_0/0.04)]',
                )}
              >
                {mode === 'demo' ? (
                  <FlaskConical className="size-3.5" />
                ) : (
                  <Globe className="size-3.5" />
                )}
                {mode === 'demo' ? 'Internal Demo' : 'External URL'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conditional content */}
      <AnimatePresence mode="wait">
        {bs4Mode === 'demo' ? (
          <motion.div
            key="demo-info"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'rounded-xl p-4 border',
              'bg-[oklch(0.65_0.20_162/0.06)] border-[oklch(0.65_0.20_162/0.20)]',
            )}
          >
            <p className="text-xs text-[oklch(0.70_0.01_260)] leading-relaxed">
              <span className="font-semibold text-[oklch(0.76_0.17_162)]">books.toscrape.com</span>
              {' '}— Scrapes titles, prices, and star ratings from the demo book store.
              No configuration needed.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="external-input"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="relative"
          >
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[oklch(0.45_0.01_260)]" />
            <input
              id="bs4-url-input"
              type="url"
              value={bs4ExternalUrl}
              onChange={(e) => setBs4ExternalUrl(e.target.value)}
              placeholder="https://your-target.com"
              spellCheck={false}
              autoComplete="off"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl text-sm',
                'bg-[oklch(1_0_0/0.04)] border border-[oklch(1_0_0/0.09)]',
                'text-[oklch(0.90_0.01_260)] placeholder:text-[oklch(0.40_0.01_260)]',
                'focus:outline-none focus:border-[oklch(0.65_0.20_162/0.60)]',
                'focus:bg-[oklch(0.65_0.20_162/0.06)] transition-all duration-200',
                'font-mono text-[0.82rem]',
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Public Export ───────────────────────────────────────── */
export function InputPanel() {
  const { engine } = useDataLabStore()

  return (
    <AnimatePresence mode="wait">
      {engine === 'scrapy' ? (
        <ScrapyInputPanel key="scrapy" />
      ) : (
        <BS4InputPanel key="bs4" />
      )}
    </AnimatePresence>
  )
}
