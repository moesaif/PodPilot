import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Server } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { getStatusColor, getStatusDot } from '../lib/utils'
import { cn } from '../lib/utils'
import type { NodeInfo } from '@shared/types'

const COLUMNS: Column<NodeInfo>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '220px',
    render: (row) => <span className="text-text-primary font-mono">{row.name}</span>,
    sortFn: (a, b) => a.name.localeCompare(b.name)
  },
  {
    key: 'status',
    label: 'Status',
    width: '100px',
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <div className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(row.status))} />
        <span className={getStatusColor(row.status)}>{row.status}</span>
      </div>
    )
  },
  {
    key: 'roles',
    label: 'Roles',
    width: '120px',
    render: (row) => (
      <div className="flex gap-1">
        {row.roles.split(',').map((r) => (
          <span key={r} className="text-2xs bg-elevated border border-border px-1.5 py-0.5 rounded text-text-secondary">
            {r}
          </span>
        ))}
      </div>
    )
  },
  {
    key: 'version',
    label: 'Version',
    width: '110px',
    render: (row) => <span className="text-text-muted font-mono text-2xs">{row.version}</span>
  },
  {
    key: 'cpu',
    label: 'CPU',
    width: '80px',
    render: (row) => <span className="text-cyan font-mono">{row.cpu}</span>
  },
  {
    key: 'memory',
    label: 'Memory',
    width: '100px',
    render: (row) => <span className="text-purple font-mono text-2xs">{row.memory}</span>
  },
  {
    key: 'os',
    label: 'OS',
    render: (row) => <span className="text-text-muted text-2xs truncate">{row.os}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono">{row.age}</span>
  },
]

export function NodesPage(): React.ReactElement {
  const { activeCluster } = useClusterStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['nodes', activeCluster],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getNodes(activeCluster)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<NodeInfo>
      title="Nodes"
      icon={<Server size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      rowKey={(node) => node.name}
    />
  )
}
