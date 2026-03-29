'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import { Sparkles } from 'lucide-react'
import { useDataLabStore } from '@/store/datalab'
import { cn } from '@/lib/utils'

export function AiOptimizer() {
  const { engine } = useDataLabStore()
  const isScrapy = engine === 'scrapy'

  return (
    <div className="flex flex-col gap-3">
      {/* Section divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[oklch(1_0_0/0.06)]" />
        <span className="text-[0.60rem] font-semibold uppercase tracking-widest text-[oklch(0.38_0.01_260)]">
          IA
        </span>
        <div className="flex-1 h-px bg-[oklch(1_0_0/0.06)]" />
      </div>

      {/* Disabled AI button with tooltip */}
      <Tooltip.Provider delayDuration={200}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            {/* Wrapper span because disabled buttons don't fire mouse events in some browsers */}
            <span className="w-full cursor-not-allowed">
              <button
                id="ai-optimizer-btn"
                disabled
                aria-disabled="true"
                className={cn(
                  'w-full flex items-center justify-center gap-2.5',
                  'py-3 px-4 rounded-xl border text-xs font-semibold',
                  'opacity-40 cursor-not-allowed',
                  'border-[oklch(1_0_0/0.10)]',
                  isScrapy
                    ? 'bg-[oklch(0.60_0.22_248/0.08)] text-[oklch(0.72_0.18_248)]'
                    : 'bg-[oklch(0.65_0.20_162/0.08)] text-[oklch(0.76_0.17_162)]',
                  'transition-all duration-200',
                  // pointer-events-none so the Trigger wrapper receives events
                  'pointer-events-none',
                )}
              >
                <Sparkles className="size-3.5 flex-shrink-0" />
                <span className="leading-tight text-center">
                  Cleaning &amp; Translation with AI
                  <span className="block text-[0.60rem] font-normal opacity-70 mt-0.5">
                    Executive Report
                  </span>
                </span>
              </button>
            </span>
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              sideOffset={8}
              className={cn(
                'max-w-[220px] px-3 py-2 rounded-xl text-[0.68rem] leading-relaxed',
                'bg-[oklch(0.13_0.018_260)] border border-[oklch(1_0_0/0.12)]',
                'text-[oklch(0.70_0.01_260)] shadow-2xl',
                'animate-in fade-in-0 zoom-in-95 duration-150',
              )}
            >
              <span className="font-semibold text-[oklch(0.82_0.01_260)]">Coming soon:</span>{' '}
              Convert raw JSON into an understandable report for executives using{' '}
              <span className="font-mono text-[oklch(0.72_0.18_248)]">GPT-4o-mini</span>.
              <Tooltip.Arrow className="fill-[oklch(0.13_0.018_260)]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  )
}
