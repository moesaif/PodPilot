import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Database } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { StatefulSetInfo } from '@shared/types'

const COLUMNS: Column<StatefulSetInfo>[] = [
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
    key: 'ready',
    label: 'Ready',
    width: '80px',
    render: (row) => {
      const [ready, total] = row.ready.split('/').map(Number)
      const healthy = ready === total
      return <span className={cn('font-mono text-xs', healthy ? 'text-green' : 'text-yellow')}>{row.ready}</span>
    }
  },
  {
    key: 'replicas',
    label: 'Replicas',
    width: '80px',
    render: (row) => <span className="text-text-secondary font-mono tabular-nums">{row.replicas}</span>,
    sortFn: (a, b) => a.replicas - b.replicas
  },
  {
    key: 'serviceName',
    label: 'Service',
    width: '160px',
    render: (row) => <span className="text-accent font-mono text-xs">{row.serviceName}</span>
  },
  {
    key: 'image',
    label: 'Image',
    render: (row) => <span className="text-text-muted font-mono text-xs truncate max-w-xs block">{row.image}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>,
    sortFn: (a, b) => a.age.localeCompare(b.age)
  },
]

export function StatefulSetsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['statefulsets', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getStatefulSets(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 15000
  })

  return (
    <ResourceTable<StatefulSetInfo>
      title="StatefulSets"
      icon={<Database size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(ss) => openDetail({ kind: 'StatefulSet', name: ss.name, namespace: ss.namespace })}
      rowKey={(ss) => `${ss.namespace}/${ss.name}`}
    />
  )
}
