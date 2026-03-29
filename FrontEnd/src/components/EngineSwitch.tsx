'use client'

import { motion, AnimatePresence } from 'motion/react'
import { Cpu, Bug } from 'lucide-react'
import { useDataLabStore } from '@/store/datalab'
import { cn } from '@/lib/utils'
import type { Engine } from '@/types'

interface EngineOption {
  id: Engine
  label: string
  sublabel: string
  Icon: React.ElementType
  accentClass: string
  pillClass: string
}

const OPTIONS: EngineOption[] = [
  {
    id: 'bs4',
    label: 'BS4',
    sublabel: 'BeautifulSoup',
    Icon: Bug,
    accentClass: 'text-[oklch(0.76_0.17_162)]',
    pillClass: 'bg-[oklch(0.65_0.20_162/0.18)] border-[oklch(0.65_0.20_162/0.45)]',
  },
  {
    id: 'scrapy',
    label: 'Scrapy',
    sublabel: 'Spider Engine',
    Icon: Cpu,
    accentClass: 'text-[oklch(0.72_0.18_248)]',
    pillClass: 'bg-[oklch(0.60_0.22_248/0.18)] border-[oklch(0.60_0.22_248/0.45)]',
  },
]

export function EngineSwitch() {
  const { engine, setEngine } = useDataLabStore()

  return (
    <div
      id="engine-switch"
      role="tablist"
      aria-label="Scraping engine selector"
      className={cn(
        'relative flex items-stretch gap-0 p-1 rounded-2xl',
        'bg-[oklch(1_0_0/0.04)] border border-[oklch(1_0_0/0.08)]',
        'shadow-[0_2px_8px_oklch(0_0_0/0.30)]',
      )}
    >
      {OPTIONS.map((opt) => {
        const isActive = engine === opt.id
        return (
          <button
            key={opt.id}
            id={`engine-tab-${opt.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${opt.id}`}
            onClick={() => setEngine(opt.id)}
            className={cn(
              'relative z-10 flex items-center gap-2.5 px-5 py-3 rounded-xl',
              'text-sm font-medium transition-colors duration-200 cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              isActive
                ? opt.accentClass
                : 'text-[oklch(0.65_0.01_260)] hover:text-[oklch(0.80_0.01_260)]',
            )}
          >
            {/* Animated sliding pill */}
            {isActive && (
              <motion.span
                layoutId="engine-pill"
                className={cn(
                  'absolute inset-0 rounded-xl border',
                  opt.pillClass,
                )}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}

            <opt.Icon
              className={cn('relative z-10 size-4', isActive && opt.accentClass)}
              strokeWidth={isActive ? 2.2 : 1.6}
            />
            <span className="relative z-10 flex flex-col items-start leading-none">
              <span className="font-semibold tracking-tight">{opt.label}</span>
              <span className={cn(
                'text-[0.68rem] mt-0.5 font-normal',
                isActive ? 'opacity-80' : 'opacity-40',
              )}>
                {opt.sublabel}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
