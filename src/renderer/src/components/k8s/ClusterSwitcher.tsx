import React, { useEffect, useState } from 'react'
import { ChevronDown, Globe, RefreshCw, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useClusterStore } from '../../stores/clusterStore'
import { ConnectClusterModal } from './ConnectClusterModal'
import { cn } from '../../lib/utils'

export function ClusterSwitcher(): React.ReactElement {
  const { clusters, activeCluster, setClusters, setActiveCluster } = useClusterStore()

  const { data, refetch, isLoading } = useQuery({
    queryKey: ['contexts'],
    queryFn: async () => {
      const res = await window.api.k8s.getContexts()
      if (res.error) throw new Error(res.error)
      return res.data
    },
    staleTime: 60000
  })

  useEffect(() => {
    if (data) {
      setClusters(data)
      const active = data.find((c) => c.isActive)
      if (active && !activeCluster) setActiveCluster(active.id)
    }
  }, [data])

  const active = clusters.find((c) => c.id === activeCluster)

  const [open, setOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const selectCluster = async (id: string) => {
    setActiveCluster(id)
    await window.api.k8s.setContext(id)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-elevated hover:bg-hover border border-border text-xs text-text-secondary transition-colors"
      >
        <Globe size={12} className="text-accent flex-shrink-0" />
        <span className="flex-1 text-left truncate text-text-primary">
          {isLoading ? 'Loading...' : (active?.name || 'Select cluster')}
        </span>
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full z-50 bg-elevated border border-border rounded shadow-xl overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
            <span className="text-2xs text-text-muted uppercase tracking-wider">Contexts</span>
            <button onClick={() => refetch()} className="text-text-muted hover:text-text-primary">
              <RefreshCw size={10} />
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {clusters.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCluster(c.id)}
                className={cn(
                  'w-full text-left px-3 py-2 text-xs hover:bg-hover transition-colors flex items-center gap-2',
                  c.id === activeCluster ? 'text-accent' : 'text-text-secondary'
                )}
              >
                <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', c.id === activeCluster ? 'bg-accent' : 'bg-border')} />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
            {clusters.length === 0 && (
              <p className="px-3 py-3 text-xs text-text-muted">No kubeconfig found</p>
            )}
          </div>
          <div className="border-t border-border p-1">
            <button
              onClick={() => { setOpen(false); setShowModal(true) }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
            >
              <Plus size={11} />
              Add cluster
            </button>
          </div>
        </div>
      )}

      {showModal && <ConnectClusterModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
