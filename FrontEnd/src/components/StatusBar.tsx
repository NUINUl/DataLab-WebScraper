'use client'

import { motion } from 'motion/react'
import { Activity, Cpu, Bug, Sparkles } from 'lucide-react'
import { useDataLabStore } from '@/store/datalab'
import { cn } from '@/lib/utils'

export function StatusBar() {
  const { engine, records, isLoading } = useDataLabStore()
  const isScrapy = engine === 'scrapy'
  const lastRecord = records[0]

  return (
    <div className={cn(
      'flex items-center justify-between px-4 py-2 rounded-xl text-[0.68rem]',
      'bg-[oklch(1_0_0/0.03)] border border-[oklch(1_0_0/0.07)]',
      'text-[oklch(0.50_0.01_260)]',
    )}>
      {/* Left — engine indicator */}
      <div className="flex items-center gap-2">
        <motion.span
          animate={isLoading ? { scale: [1, 1.3, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className={cn(
            'size-1.5 rounded-full',
            isLoading
              ? isScrapy
                ? 'bg-[oklch(0.72_0.18_248)] shadow-[0_0_6px_oklch(0.60_0.22_248/0.80)]'
                : 'bg-[oklch(0.76_0.17_162)] shadow-[0_0_6px_oklch(0.65_0.20_162/0.80)]'
              : 'bg-[oklch(0.35_0.01_260)]',
          )}
        />
        <span className="flex items-center gap-1">
          {isScrapy ? <Cpu className="size-2.5" /> : <Bug className="size-2.5" />}
          {isLoading ? 'Scraping…' : `Engine: ${isScrapy ? 'Scrapy' : 'BeautifulSoup4'}`}
        </span>
      </div>

      {/* Center — last result stats */}
      {lastRecord && (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Activity className="size-2.5" />
            {lastRecord.response.metadata.elapsed_ms}ms
          </span>
          <span>HTTP {lastRecord.response.metadata.status_code}</span>
          <span>{Object.keys(lastRecord.response.data).length} fields</span>
        </div>
      )}

      {/* Right — DB records count */}
      <div className="flex items-center gap-1">
        <Sparkles className="size-2.5" />
        {records.length} saved
      </div>
    </div>
  )
}
