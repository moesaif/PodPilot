import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, RefreshCw, Search, Filter } from 'lucide-react'
import { useClusterStore } from '../stores/clusterStore'
import { cn } from '../lib/utils'
import type { EventInfo } from '@shared/types'

export function EventsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'warning' | 'normal'>('all')

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['events', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getEvents(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 10000
  })

  const filtered = data.filter((evt) => {
    if (filter === 'warning' && evt.type !== 'Warning') return false
    if (filter === 'normal' && evt.type !== 'Normal') return false
    if (search) {
      const s = search.toLowerCase()
      return evt.message.toLowerCase().includes(s) ||
        evt.reason.toLowerCase().includes(s) ||
        evt.object.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <AlertCircle size={14} className="text-text-muted" />
        <h2 className="text-text-primary font-semibold text-sm">Events</h2>
        <span className="text-2xs text-text-muted bg-elevated px-1.5 py-0.5 rounded font-mono">{filtered.length}</span>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 ml-2">
          {(['all', 'warning', 'normal'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize',
                filter === f
                  ? f === 'warning' ? 'bg-yellow/20 text-yellow border border-yellow/30'
                    : f === 'normal' ? 'bg-green/20 text-green border border-green/30'
                      : 'bg-accent/20 text-accent border border-accent/30'
                  : 'text-text-muted hover:text-text-secondary hover:bg-hover'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-xs relative ml-auto">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-elevated border border-border rounded pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={cn(isLoading && 'animate-spin')} />
        </button>
      </div>

      {error && (
        <div className="m-3 px-3 py-2 bg-red/10 border border-red/20 rounded text-xs text-red">
          {error.message}
        </div>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-muted text-xs">
            {isLoading ? 'Loading...' : 'No events found'}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((evt, i) => (
              <EventRow key={`${evt.name}-${i}`} event={evt} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: EventInfo }) {
  const isWarning = event.type === 'Warning'

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-2.5 hover:bg-elevated/50 transition-colors',
      isWarning && 'border-l-2 border-l-yellow/50'
    )}>
      <div className={cn(
        'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
        isWarning ? 'bg-yellow' : 'bg-green/50'
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono text-text-secondary">{event.object}</span>
          <span className={cn(
            'text-2xs font-medium px-1.5 py-0.5 rounded',
            isWarning ? 'text-yellow bg-yellow/10' : 'text-green bg-green/10'
          )}>
            {event.reason}
          </span>
          {event.namespace && (
            <span className="text-2xs text-text-muted">ns: {event.namespace}</span>
          )}
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">{event.message}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {event.count > 1 && (
          <span className="text-2xs text-text-muted bg-elevated px-1.5 py-0.5 rounded font-mono">
            ×{event.count}
          </span>
        )}
        <span className="text-2xs text-text-muted">
          {event.lastTime ? new Date(event.lastTime).toLocaleTimeString() : ''}
        </span>
      </div>
    </div>
  )
}
