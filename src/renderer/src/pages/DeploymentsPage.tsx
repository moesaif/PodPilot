import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layers } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { DeploymentInfo } from '@shared/types'

const COLUMNS: Column<DeploymentInfo>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '260px',
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
      const ok = ready === total
      return (
        <span className={cn('font-mono', ok ? 'text-green' : 'text-yellow')}>{row.ready}</span>
      )
    }
  },
  {
    key: 'upToDate',
    label: 'Up-to-date',
    width: '90px',
    render: (row) => <span className="text-text-muted font-mono">{row.upToDate}</span>
  },
  {
    key: 'available',
    label: 'Available',
    width: '90px',
    render: (row) => <span className="text-green font-mono">{row.available}</span>
  },
  {
    key: 'image',
    label: 'Image',
    render: (row) => (
      <span className="text-text-muted font-mono text-2xs truncate max-w-xs block">{row.image}</span>
    )
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono">{row.age}</span>
  },
]

export function DeploymentsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deployments', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getDeployments(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 15000
  })

  return (
    <ResourceTable<DeploymentInfo>
      title="Deployments"
      icon={<Layers size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(dep) => openDetail({ kind: 'Deployment', name: dep.name, namespace: dep.namespace })}
      rowKey={(dep) => `${dep.namespace}/${dep.name}`}
    />
  )
}
