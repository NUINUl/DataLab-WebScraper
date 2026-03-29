'use client'

import { motion } from 'motion/react'
import { HardDrive, Cloud, FlaskConical, Download } from 'lucide-react'
import { useDataLabStore } from '@/store/datalab'
import { cn } from '@/lib/utils'
import type { PersistenceMode } from '@/types'

/* ── Option descriptor ─────────────────────────────────────── */
const OPTIONS: {
  mode: PersistenceMode
  label: string
  icon: React.ElementType
}[] = [
    { mode: 'cache', label: 'Cache', icon: FlaskConical },
    { mode: 'local', label: 'Local', icon: HardDrive },
    { mode: 'cloud', label: 'Cloud', icon: Cloud },
  ]

export function PersistencePanel() {
  const { persistenceMode, setPersistenceMode, downloadJson, records, engine } =
    useDataLabStore()

  const isScrapy = engine === 'scrapy'
  const accentColor = isScrapy ? 'oklch(0.60_0.22_248)' : 'oklch(0.65_0.20_162)'
  const accentLight = isScrapy ? 'oklch(0.72_0.18_248)' : 'oklch(0.76_0.17_162)'

  return (
    <div className="flex flex-col gap-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'size-1.5 rounded-full transition-colors duration-500',
            isScrapy
              ? 'bg-[oklch(0.72_0.18_248)] shadow-[0_0_8px_oklch(0.60_0.22_248/0.70)]'
              : 'bg-[oklch(0.76_0.17_162)] shadow-[0_0_8px_oklch(0.65_0.20_162/0.70)]',
          )}
        />
        <h2 className="text-xs font-semibold text-[oklch(0.60_0.01_260)] uppercase tracking-wider">
          Persistence Strategy
        </h2>
      </div>

      {/* Segmented control */}
      <div
        role="group"
        aria-label="Persistence Mode"
        className="flex items-stretch rounded-xl border border-[oklch(1_0_0/0.08)] bg-[oklch(1_0_0/0.03)] p-0.5 gap-0.5"
      >
        {OPTIONS.map(({ mode, label, icon: Icon }) => {
          const isActive = persistenceMode === mode
          return (
            <motion.button
              key={mode}
              id={`persistence-${mode}`}
              aria-pressed={isActive}
              onClick={() => setPersistenceMode(mode)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-[10px]',
                'text-[0.65rem] font-semibold tracking-wide transition-all duration-200 cursor-pointer',
                isActive
                  ? 'text-white'
                  : 'text-[oklch(0.45_0.01_260)] hover:text-[oklch(0.72_0.01_260)]',
              )}
              style={
                isActive
                  ? {
                    background: `linear-gradient(135deg, ${accentColor}/0.35, ${accentColor}/0.18)`,
                    borderColor: `${accentColor}/0.40`,
                    boxShadow: `0 0 12px ${accentColor}/0.20, inset 0 1px 0 ${accentLight}/0.10`,
                    border: `1px solid`,
                    color: accentLight,
                  }
                  : {}
              }
            >
              <Icon className="size-3.5" strokeWidth={isActive ? 2 : 1.5} />
              <span>{label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Mode-specific extras */}
      <div className="flex flex-col gap-2">
        {/* CACHE — description chip */}
        {persistenceMode === 'cache' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[0.68rem] text-[oklch(0.42_0.01_260)] leading-relaxed px-1"
          >
            Data shows in virtual console and{' '}
            <span className="text-[oklch(0.50_0.01_260)]">disappears when refreshed</span>.
          </motion.p>
        )}

        {/* LOCAL — download button */}
        {persistenceMode === 'local' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1.5"
          >
            <p className="text-[0.68rem] text-[oklch(0.42_0.01_260)] leading-relaxed px-1">
              Saved in <span className="text-[oklch(0.50_0.01_260)] font-mono">localStorage</span>.
              Persists between sessions.
            </p>
            <button
              id="download-json-btn"
              onClick={downloadJson}
              disabled={records.length === 0}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'py-2 rounded-lg border text-xs font-medium',
                'transition-all duration-200 cursor-pointer',
                records.length > 0
                  ? 'border-[oklch(1_0_0/0.12)] text-[oklch(0.75_0.01_260)] hover:border-[oklch(1_0_0/0.22)] hover:text-white hover:bg-[oklch(1_0_0/0.05)]'
                  : 'border-[oklch(1_0_0/0.05)] text-[oklch(0.35_0.01_260)] opacity-40 cursor-not-allowed',
              )}
            >
              <Download className="size-3.5" />
              Download JSON
              {records.length > 0 && (
                <span className="ml-auto text-[0.60rem] opacity-50">
                  {records.length} reg.
                </span>
              )}
            </button>
          </motion.div>
        )}

        {/* CLOUD — quota note */}
        {persistenceMode === 'cloud' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1"
          >
            <p className="text-[0.68rem] text-[oklch(0.42_0.01_260)] leading-relaxed px-1">
              Sends directly to the{' '}
              <span className="text-[oklch(0.50_0.01_260)]">Real API</span> and persists in MongoDB Atlas.
            </p>
            <p className="text-[0.63rem] text-[oklch(0.38_0.01_260)] px-1 leading-relaxed">
              Quota: 20MB per client · Auto-delete after 24h
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
