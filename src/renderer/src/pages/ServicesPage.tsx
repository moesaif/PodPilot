import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Network } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { ServiceInfo } from '@shared/types'

const TYPE_COLORS: Record<string, string> = {
  ClusterIP: 'text-accent',
  NodePort: 'text-yellow',
  LoadBalancer: 'text-green',
  ExternalName: 'text-purple'
}

const COLUMNS: Column<ServiceInfo>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '240px',
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
    key: 'type',
    label: 'Type',
    width: '120px',
    render: (row) => (
      <span className={cn('font-mono text-xs', TYPE_COLORS[row.type] || 'text-text-secondary')}>
        {row.type}
      </span>
    ),
    sortFn: (a, b) => a.type.localeCompare(b.type)
  },
  {
    key: 'clusterIP',
    label: 'Cluster IP',
    width: '130px',
    render: (row) => <span className="text-text-muted font-mono text-2xs">{row.clusterIP}</span>
  },
  {
    key: 'externalIP',
    label: 'External IP',
    width: '130px',
    render: (row) => (
      <span className={cn('font-mono text-2xs', row.externalIP !== '<none>' ? 'text-green' : 'text-text-muted')}>
        {row.externalIP}
      </span>
    )
  },
  {
    key: 'ports',
    label: 'Ports',
    render: (row) => <span className="text-text-secondary font-mono text-2xs">{row.ports}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono">{row.age}</span>
  },
]

export function ServicesPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['services', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getServices(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<ServiceInfo>
      title="Services"
      icon={<Network size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(svc) => openDetail({ kind: 'Service', name: svc.name, namespace: svc.namespace })}
      rowKey={(svc) => `${svc.namespace}/${svc.name}`}
    />
  )
}
