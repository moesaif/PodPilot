import React from 'react'
import { ChevronDown, Layers } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useClusterStore } from '../../stores/clusterStore'
import { cn } from '../../lib/utils'

export function NamespacePicker(): React.ReactElement {
  const { activeCluster, activeNamespace, setActiveNamespace, setNamespaces, namespaces } = useClusterStore()
  const [open, setOpen] = React.useState(false)

  useQuery({
    queryKey: ['namespaces', activeCluster],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getNamespaces(activeCluster)
      if (res.error) throw new Error(res.error)
      setNamespaces(res.data || [])
      return res.data
    },
    enabled: !!activeCluster,
    staleTime: 60000
  })

  const allNs = [{ name: 'all' }, ...namespaces]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-elevated hover:bg-hover border border-border text-xs text-text-secondary transition-colors"
      >
        <Layers size={12} className="text-purple flex-shrink-0" />
        <span className="flex-1 text-left text-text-primary truncate">{activeNamespace}</span>
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full z-50 bg-elevated border border-border rounded shadow-xl overflow-hidden animate-fade-in">
          <div className="max-h-48 overflow-y-auto">
            {allNs.map((ns) => (
              <button
                key={ns.name}
                onClick={() => { setActiveNamespace(ns.name); setOpen(false) }}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-xs hover:bg-hover transition-colors',
                  ns.name === activeNamespace ? 'text-purple' : 'text-text-secondary'
                )}
              >
                {ns.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
