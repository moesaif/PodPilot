import React, { useState } from 'react'
import { Search, RefreshCw, ChevronUp, ChevronDown, Stethoscope } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  key: string
  label: string
  width?: string
  render: (row: T) => React.ReactNode
  sortFn?: (a: T, b: T) => number
}

interface ResourceTableProps<T> {
  title: string
  icon?: React.ReactNode
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  onRowClick?: (row: T) => void
  onDiagnose?: (row: T) => void
  rowKey: (row: T) => string
  emptyMessage?: string
}

export function ResourceTable<T>({
  title, icon, data, columns, loading, error, onRefresh, onRowClick, onDiagnose, rowKey, emptyMessage
}: ResourceTableProps<T>): React.ReactElement {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = data.filter((row) => {
    if (!search) return true
    const str = JSON.stringify(row).toLowerCase()
    return str.includes(search.toLowerCase())
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortFn) return 0
    return sortDir === 'asc' ? col.sortFn(a, b) : col.sortFn(b, a)
  })

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          {icon && <span className="text-text-muted">{icon}</span>}
          <h2 className="text-text-primary font-semibold text-sm tracking-tight">{title}</h2>
          <span className="text-2xs text-text-muted bg-elevated px-1.5 py-0.5 rounded font-mono tabular-nums">{filtered.length}</span>
        </div>

        <div className="flex-1 max-w-xs relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="w-full bg-elevated border border-border rounded pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="m-3 px-3 py-2 bg-red/10 border border-red/20 rounded text-xs text-red">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortFn && handleSort(col.key)}
                  className={cn(
                    'text-left px-3 py-2.5 text-2xs text-text-muted uppercase tracking-[0.1em] font-semibold whitespace-nowrap',
                    col.sortFn && 'cursor-pointer hover:text-text-secondary select-none'
                  )}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
                    )}
                  </div>
                </th>
              ))}
              {onDiagnose && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onDiagnose ? 1 : 0)} className="px-3 py-8 text-center text-text-muted text-xs">
                  Loading...
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onDiagnose ? 1 : 0)} className="px-3 py-8 text-center text-text-muted text-xs">
                  {emptyMessage || 'No resources found'}
                </td>
              </tr>
            ) : sorted.map((row, i) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border/50 transition-colors',
                  i % 2 === 0 ? 'bg-base' : 'bg-surface/30',
                  onRowClick && 'cursor-pointer hover:bg-selected'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {col.render(row)}
                  </td>
                ))}
                {onDiagnose && (
                  <td className="px-2 py-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDiagnose(row) }}
                      title="AI Diagnose"
                      className="p-1 rounded text-text-muted hover:text-purple hover:bg-purple/10 transition-colors"
                    >
                      <Stethoscope size={12} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
