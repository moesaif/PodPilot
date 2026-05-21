import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cpu } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { DaemonSetInfo } from '@shared/types'

const COLUMNS: Column<DaemonSetInfo>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '220px',
    render: (row) => <span className="text-text-primary font-mono">{row.name}</span>,
    sortFn: (a, b) => a.name.localeCompare(b.name)
  },
  {
    key: 'namespace',
    label: 'Namespace',
    width: '120px',
    render: (row) => <span className="text-text-muted font-mono">{row.namespace}</span>
  },
  {
    key: 'desired',
    label: 'Desired',
    width: '80px',
    render: (row) => <span className="text-text-secondary font-mono tabular-nums">{row.desired}</span>,
    sortFn: (a, b) => a.desired - b.desired
  },
  {
    key: 'current',
    label: 'Current',
    width: '80px',
    render: (row) => <span className="text-text-secondary font-mono tabular-nums">{row.current}</span>
  },
  {
    key: 'ready',
    label: 'Ready',
    width: '80px',
    render: (row) => {
      const healthy = row.ready === row.desired
      return <span className={cn('font-mono text-xs tabular-nums', healthy ? 'text-green' : 'text-yellow')}>{row.ready}</span>
    },
    sortFn: (a, b) => a.ready - b.ready
  },
  {
    key: 'upToDate',
    label: 'Up-to-date',
    width: '100px',
    render: (row) => <span className="text-text-secondary font-mono tabular-nums">{row.upToDate}</span>
  },
  {
    key: 'image',
    label: 'Image',
    render: (row) => <span className="text-text-muted font-mono text-xs">{row.image}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>
  },
]

export function DaemonSetsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['daemonsets', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getDaemonSets(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 15000
  })

  return (
    <ResourceTable<DaemonSetInfo>
      title="DaemonSets"
      icon={<Cpu size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(ds) => openDetail({ kind: 'DaemonSet', name: ds.name, namespace: ds.namespace })}
      rowKey={(ds) => `${ds.namespace}/${ds.name}`}
    />
  )
}
