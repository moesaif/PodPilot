import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Globe } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { IngressInfo } from '@shared/types'

const COLUMNS: Column<IngressInfo>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '200px',
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
    key: 'className',
    label: 'Class',
    width: '120px',
    render: (row) => (
      <span className={cn('font-mono text-xs', row.className ? 'text-purple' : 'text-text-muted')}>
        {row.className || '—'}
      </span>
    )
  },
  {
    key: 'hosts',
    label: 'Hosts',
    width: '220px',
    render: (row) => <span className="text-accent font-mono text-xs">{row.hosts}</span>
  },
  {
    key: 'address',
    label: 'Address',
    width: '140px',
    render: (row) => (
      <span className={cn('font-mono text-xs tabular-nums', row.address ? 'text-green' : 'text-text-muted')}>
        {row.address || 'pending'}
      </span>
    )
  },
  {
    key: 'ports',
    label: 'Ports',
    width: '80px',
    render: (row) => <span className="text-text-secondary font-mono text-xs">{row.ports}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>
  },
]

export function IngressesPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ingresses', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getIngresses(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<IngressInfo>
      title="Ingresses"
      icon={<Globe size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(ing) => openDetail({ kind: 'Ingress', name: ing.name, namespace: ing.namespace })}
      rowKey={(ing) => `${ing.namespace}/${ing.name}`}
    />
  )
}
