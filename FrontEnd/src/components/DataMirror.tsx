'use client'

import { useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Database, Clock, Zap, Trash2, Link2 } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useDataLabStore } from '@/store/datalab'
import { cn, formatTime, truncate } from '@/lib/utils'
import type { DbRecord, SelectorResult } from '@/types'

/* ── JSON Token Renderer ─────────────────────────────────── */
function JsonToken({ type, value }: { type: string; value: string }) {
  const colorMap: Record<string, string> = {
    key: 'text-[oklch(0.72_0.18_248)]',
    string: 'text-[oklch(0.76_0.17_162)]',
    number: 'text-[oklch(0.80_0.16_55)]',
    boolean: 'text-[oklch(0.75_0.18_0)]',
    null: 'text-[oklch(0.50_0.00_0)]',
    brace: 'text-[oklch(0.70_0.01_260)]',
    colon: 'text-[oklch(0.45_0.01_260)]',
  }
  return (
    <span className={cn('font-json', colorMap[type] ?? 'text-[oklch(0.75_0.01_260)]')}>
      {value}
    </span>
  )
}

/* ── JSON Line component ─────────────────────────────────── */
function JsonLine({
  indent,
  children,
  delay,
}: {
  indent: number
  children: React.ReactNode
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay }}
      className="flex items-start leading-6"
    >
      <span style={{ minWidth: `${indent * 16}px` }} />
      <span className="text-[0.78rem] font-mono">{children}</span>
    </motion.div>
  )
}

/* ── Render SelectorResult as JSON lines ───────────────── */
function SelectorResultLines({
  fieldName,
  result,
  baseDelay,
  isLast,
}: {
  fieldName: string
  result: SelectorResult
  baseDelay: number
  isLast: boolean
}) {
  const { value, selector, match_count } = result
  const isArray = Array.isArray(value)
  const valueDisplay = isArray
    ? (value as string[])
    : value === null
      ? null
      : String(value)

  return (
    <>
      {/* Field key */}
      <JsonLine indent={1} delay={baseDelay}>
        <JsonToken type="key" value={`"${fieldName}"`} />
        <JsonToken type="colon" value=": {" />
      </JsonLine>

      {/* selector */}
      <JsonLine indent={2} delay={baseDelay + 0.04}>
        <JsonToken type="key" value={`"selector"`} />
        <JsonToken type="colon" value=": " />
        <JsonToken type="string" value={`"${selector}"`} />
        <JsonToken type="colon" value="," />
      </JsonLine>

      {/* match_count */}
      <JsonLine indent={2} delay={baseDelay + 0.08}>
        <JsonToken type="key" value={`"match_count"`} />
        <JsonToken type="colon" value=": " />
        <JsonToken type="number" value={String(match_count)} />
        <JsonToken type="colon" value="," />
      </JsonLine>

      {/* value */}
      {isArray ? (
        <>
          <JsonLine indent={2} delay={baseDelay + 0.12}>
            <JsonToken type="key" value={`"value"`} />
            <JsonToken type="colon" value=": [" />
          </JsonLine>
          {(valueDisplay as string[]).slice(0, 5).map((v, i) => (
            <JsonLine key={i} indent={3} delay={baseDelay + 0.14 + i * 0.04}>
              <JsonToken type="string" value={`"${truncate(v, 60)}"`} />
              {i < Math.min((valueDisplay as string[]).length, 5) - 1 && (
                <JsonToken type="colon" value="," />
              )}
            </JsonLine>
          ))}
          {(valueDisplay as string[]).length > 5 && (
            <JsonLine indent={3} delay={baseDelay + 0.34}>
              <JsonToken
                type="null"
                value={`… +${(valueDisplay as string[]).length - 5} more`}
              />
            </JsonLine>
          )}
          <JsonLine indent={2} delay={baseDelay + 0.36}>
            <JsonToken type="brace" value="]" />
          </JsonLine>
        </>
      ) : (
        <JsonLine indent={2} delay={baseDelay + 0.12}>
          <JsonToken type="key" value={`"value"`} />
          <JsonToken type="colon" value=": " />
          {value === null ? (
            <JsonToken type="null" value="null" />
          ) : (
            <JsonToken type="string" value={`"${truncate(String(value), 80)}"`} />
          )}
        </JsonLine>
      )}

      {/* Closing brace */}
      <JsonLine indent={1} delay={baseDelay + 0.40}>
        <JsonToken type="brace" value={isLast ? '}' : '},'} />
      </JsonLine>
    </>
  )
}

/* ── Record Pill (sidebar item) ──────────────────────────── */
function RecordPill({
  record,
  isSelected,
  onClick,
}: {
  record: DbRecord
  isSelected: boolean
  onClick: () => void
}) {
  const isScrapy = record.engine === 'scrapy'
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, height: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-xl border text-xs',
        'transition-all duration-150 cursor-pointer',
        isSelected
          ? isScrapy
            ? 'bg-[oklch(0.60_0.22_248/0.18)] border-[oklch(0.60_0.22_248/0.45)] text-[oklch(0.72_0.18_248)]'
            : 'bg-[oklch(0.65_0.20_162/0.18)] border-[oklch(0.65_0.20_162/0.45)] text-[oklch(0.76_0.17_162)]'
          : 'bg-[oklch(1_0_0/0.03)] border-[oklch(1_0_0/0.07)] text-[oklch(0.60_0.01_260)] hover:border-[oklch(1_0_0/0.14)] hover:text-[oklch(0.80_0.01_260)]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          'font-semibold uppercase text-[0.65rem] tracking-wider px-1.5 py-0.5 rounded',
          isScrapy
            ? 'bg-[oklch(0.60_0.22_248/0.20)] text-[oklch(0.72_0.18_248)]'
            : 'bg-[oklch(0.65_0.20_162/0.20)] text-[oklch(0.76_0.17_162)]',
        )}>
          {record.engine}
        </span>
        <Clock className="size-2.5 opacity-50" />
      </div>
      <div className="mt-1 font-mono opacity-70 truncate">
        {truncate(record.response.metadata.url, 32)}
      </div>
      <div className="mt-0.5 opacity-50">{formatTime(record.timestamp)}</div>
    </motion.button>
  )
}

/* ── Glass Data Mirror ───────────────────────────────────── */
export function DataMirror() {
  const {
    records,
    selectedRecordId,
    setSelectedRecordId,
    clearRecords,
    engine,
  } = useDataLabStore()

  const mirrorRef = useRef<HTMLDivElement>(null)
  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? records[0] ?? null

  // Light-pulse border effect when a new record lands
  const lastRecordId = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedRecord) return
    if (selectedRecord.id === lastRecordId.current) return
    lastRecordId.current = selectedRecord.id

    const el = mirrorRef.current
    if (!el) return
    const cls = selectedRecord.engine === 'scrapy' ? 'pulse-cobalt' : 'pulse-emerald'
    el.classList.add(cls)
    setTimeout(() => el.classList.remove(cls), 900)
  }, [selectedRecord])

  /* Build JSON lines from selected record */
  const { metadata, data } = selectedRecord?.response ?? {}
  const fields = data ? Object.entries(data) : []

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'size-7 rounded-lg flex items-center justify-center',
            engine === 'scrapy'
              ? 'bg-[oklch(0.60_0.22_248/0.15)]'
              : 'bg-[oklch(0.65_0.20_162/0.15)]',
          )}>
            <Database className={cn(
              'size-3.5',
              engine === 'scrapy'
                ? 'text-[oklch(0.72_0.18_248)]'
                : 'text-[oklch(0.76_0.17_162)]',
            )} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[oklch(0.88_0.01_260)]">
              Data Mirror
            </h2>
            <p className="text-[0.68rem] text-[oklch(0.48_0.01_260)]">
              {records.length} record{records.length !== 1 ? 's' : ''} in local DB
            </p>
          </div>
        </div>

        {records.length > 0 && (
          <Tooltip.Provider delayDuration={400}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button
                  onClick={clearRecords}
                  aria-label="Clear all records"
                  className="size-7 rounded-lg flex items-center justify-center text-[oklch(0.45_0.01_260)] hover:text-[oklch(0.75_0.18_0)] hover:bg-[oklch(0.75_0.18_0/0.10)] transition-all duration-150 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  sideOffset={6}
                  className="px-2.5 py-1 rounded-lg text-xs bg-[oklch(0.15_0.018_260)] border border-[oklch(1_0_0/0.10)] text-[oklch(0.75_0.01_260)] shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  Clear all records
                  <Tooltip.Arrow className="fill-[oklch(0.15_0.018_260)]" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        )}
      </div>

      {/* Record Sidebar + JSON Viewer */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Sidebar — record list */}
        {records.length > 0 && (
          <div className="w-32 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
            <AnimatePresence>
              {records.slice(0, 20).map((rec) => (
                <RecordPill
                  key={rec.id}
                  record={rec}
                  isSelected={rec.id === (selectedRecordId ?? records[0]?.id)}
                  onClick={() => setSelectedRecordId(rec.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Main JSON panel */}
        <div
          ref={mirrorRef}
          className={cn(
            'flex-1 rounded-2xl p-4 overflow-y-auto min-h-[280px] flex flex-col gap-3',
            'bg-[oklch(0.08_0.012_260)] border border-[oklch(1_0_0/0.07)]',
            'transition-[box-shadow] duration-300',
          )}
        >
          {/* MongoDB record_id banner — shown prominently when cloud returns an ID */}
          <AnimatePresence>
            {selectedRecord?.response.record_id && (
              <motion.div
                key={`rid-${selectedRecord.id}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl',
                  'border border-[oklch(0.60_0.22_248/0.30)]',
                  'bg-[oklch(0.60_0.22_248/0.08)]',
                )}
              >
                <Link2 className="size-3.5 text-[oklch(0.65_0.20_248)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[0.60rem] font-semibold uppercase tracking-wider text-[oklch(0.50_0.01_260)]">
                    MongoDB Record ID
                  </p>
                  <p className="text-[0.70rem] font-mono text-[oklch(0.72_0.18_248)] truncate">
                    {selectedRecord.response.record_id}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!selectedRecord ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center gap-3 text-center py-10"
              >
                <div className="size-12 rounded-2xl bg-[oklch(1_0_0/0.04)] border border-[oklch(1_0_0/0.07)] flex items-center justify-center">
                  <Zap className="size-5 text-[oklch(0.40_0.01_260)]" />
                </div>
                <p className="text-sm text-[oklch(0.45_0.01_260)] max-w-[180px] leading-relaxed">
                  Hit <span className="font-semibold text-[oklch(0.60_0.01_260)]">Scrape</span> to
                  populate the data mirror
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedRecord.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col"
              >
                {/* Opening brace */}
                <JsonLine indent={0} delay={0}>
                  <JsonToken type="brace" value="{" />
                </JsonLine>

                {/* metadata block */}
                <JsonLine indent={1} delay={0.04}>
                  <JsonToken type="key" value={'"metadata"'} />
                  <JsonToken type="colon" value=": {" />
                </JsonLine>
                {metadata && Object.entries(metadata).map(([k, v], i) => (
                  <JsonLine key={k} indent={2} delay={0.06 + i * 0.04}>
                    <JsonToken type="key" value={`"${k}"`} />
                    <JsonToken type="colon" value=": " />
                    <JsonToken
                      type={typeof v === 'number' ? 'number' : 'string'}
                      value={typeof v === 'number' ? String(v) : `"${truncate(String(v), 60)}"`}
                    />
                    {i < Object.entries(metadata).length - 1 && (
                      <JsonToken type="colon" value="," />
                    )}
                  </JsonLine>
                ))}
                <JsonLine indent={1} delay={0.30}>
                  <JsonToken type="brace" value='},' />
                </JsonLine>

                {/* data block */}
                <JsonLine indent={1} delay={0.34}>
                  <JsonToken type="key" value={'"data"'} />
                  <JsonToken type="colon" value=": {" />
                </JsonLine>
                {fields.map(([fieldName, result], idx) => (
                  <SelectorResultLines
                    key={fieldName}
                    fieldName={fieldName}
                    result={result}
                    baseDelay={0.38 + idx * 0.44}
                    isLast={idx === fields.length - 1}
                  />
                ))}
                <JsonLine indent={1} delay={0.38 + fields.length * 0.44}>
                  <JsonToken type="brace" value="}" />
                </JsonLine>

                {/* Closing brace */}
                <JsonLine indent={0} delay={0.42 + fields.length * 0.44}>
                  <JsonToken type="brace" value="}" />
                </JsonLine>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
