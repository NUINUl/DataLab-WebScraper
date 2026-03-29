'use client'

import { motion } from 'motion/react'
import { EngineSwitch } from '@/components/EngineSwitch'
import { InputPanel } from '@/components/InputPanel'
import { DataMirror } from '@/components/DataMirror'
import { ScrapeButton } from '@/components/ScrapeButton'
import { StatusBar } from '@/components/StatusBar'
import { PersistencePanel } from '@/components/PersistencePanel'
import { AiOptimizer } from '@/components/AiOptimizer'
import { useDataLabStore } from '@/store/datalab'
import { cn } from '@/lib/utils'
import { Hexagon, Github } from 'lucide-react'

/* ── Animated background grid ────────────────────────────── */
function BackgroundGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {/* Dark radial gradient base */}
      <div className="absolute inset-0 bg-[oklch(0.08_0.012_260)]" />

      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(oklch(1_0_0) 1px, transparent 1px),
            linear-gradient(90deg, oklch(1_0_0) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial glow spots */}
      <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-[oklch(0.60_0.22_248/0.05)] blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full bg-[oklch(0.65_0.20_162/0.04)] blur-[120px]" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-[oklch(0.60_0.22_248/0.03)] blur-[80px]" />
    </div>
  )
}

/* ── Header ──────────────────────────────────────────────── */
function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[oklch(1_0_0/0.06)]">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="relative size-8 flex items-center justify-center">
          <Hexagon
            className="size-8 text-[oklch(0.60_0.22_248)] fill-[oklch(0.60_0.22_248/0.15)]"
            strokeWidth={1.5}
          />
          <span className="absolute text-[0.55rem] font-bold text-[oklch(0.72_0.18_248)] tracking-tight">
            DL
          </span>
        </div>
        <div className="leading-none">
          <span className="text-sm font-semibold text-[oklch(0.90_0.01_260)] tracking-tight">
            DataLab
          </span>
          <span className="block text-[0.60rem] text-[oklch(0.45_0.01_260)] mt-0.5">
            Scraping Engine v1.0
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-4">
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[oklch(0.50_0.01_260)] hover:text-[oklch(0.80_0.01_260)] transition-colors"
        >
          API Docs ↗
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-[oklch(0.45_0.01_260)] hover:text-[oklch(0.80_0.01_260)] transition-colors"
        >
          <Github className="size-4" />
        </a>
      </nav>
    </header>
  )
}

/* ── Main App Shell ──────────────────────────────────────── */
export default function DataLabApp() {
  const { engine } = useDataLabStore()
  const isScrapy = engine === 'scrapy'

  return (
    <div className="relative min-h-dvh flex flex-col">
      <BackgroundGrid />
      <Header />

      {/* Hero accent band */}
      <div
        aria-hidden
        className={cn(
          'absolute top-[56px] left-0 right-0 h-px transition-all duration-700',
          isScrapy
            ? 'bg-gradient-to-r from-transparent via-[oklch(0.60_0.22_248/0.60)] to-transparent'
            : 'bg-gradient-to-r from-transparent via-[oklch(0.65_0.20_162/0.60)] to-transparent',
        )}
      />

      {/* Main content */}
      <main className="relative flex-1 flex flex-col gap-6 px-6 py-8 max-w-[1400px] mx-auto w-full">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl font-bold tracking-tight text-[oklch(0.92_0.01_260)]">
            Web Scraping{' '}
            <span className={cn(
              'transition-colors duration-500',
              isScrapy
                ? 'text-[oklch(0.72_0.18_248)]'
                : 'text-[oklch(0.76_0.17_162)]',
            )}>
              Console
            </span>
          </h1>
          <p className="text-sm text-[oklch(0.48_0.01_260)]">
            Multi-engine extraction · Real-time JSON output · Local persistence
          </p>
        </motion.div>

        {/* Engine Switch — centered */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="flex justify-center"
        >
          <EngineSwitch />
        </motion.div>

        {/* Two-column workspace */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.40, delay: 0.16 }}
          className="flex flex-col lg:flex-row gap-4 flex-1"
        >
          {/* ── Input Panel (40%) ───────────────────────────── */}
          <div
            id="panel-bs4"
            className={cn(
              'lg:w-[38%] flex flex-col gap-4',
              'glass-panel p-6',
              '@container',
            )}
          >
            {/* Panel header */}
            <div className="flex items-center gap-2">
              <div className={cn(
                'size-1.5 rounded-full transition-colors duration-500',
                isScrapy
                  ? 'bg-[oklch(0.72_0.18_248)] shadow-[0_0_8px_oklch(0.60_0.22_248/0.70)]'
                  : 'bg-[oklch(0.76_0.17_162)] shadow-[0_0_8px_oklch(0.65_0.20_162/0.70)]',
              )} />
              <h2 className="text-xs font-semibold text-[oklch(0.60_0.01_260)] uppercase tracking-wider">
                Configuration
              </h2>
            </div>

            {/* Dynamic input area */}
            <div className="flex-1">
              <InputPanel />
            </div>

            {/* Scrape button */}
            <ScrapeButton />

            {/* Divider */}
            <div className="h-px bg-[oklch(1_0_0/0.06)]" />

            {/* Persistence strategy selector */}
            <PersistencePanel />

            {/* AI Optimizer placeholder */}
            <AiOptimizer />
          </div>

          {/* ── Data Mirror (60%) ───────────────────────────── */}
          <div
            className={cn(
              'lg:flex-1 min-h-[400px] flex flex-col',
              'glass-panel p-6',
              '@container',
            )}
          >
            <DataMirror />
          </div>
        </motion.div>

        {/* Status Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.30, delay: 0.30 }}
        >
          <StatusBar />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative text-center py-4 text-[0.65rem] text-[oklch(0.35_0.01_260)] border-t border-[oklch(1_0_0/0.05)]">
        DataLab · BS4 + Scrapy engines · FastAPI backend on{' '}
        <code className="font-mono text-[oklch(0.42_0.01_260)]">localhost:8000</code>
      </footer>
    </div>
  )
}
