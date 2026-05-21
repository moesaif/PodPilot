import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Folder } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { cn } from '../lib/utils'
import type { NamespaceInfo } from '@shared/types'

const COLUMNS: Column<NamespaceInfo>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '260px',
    render: (row) => <span className="text-text-primary font-mono font-medium">{row.name}</span>,
    sortFn: (a, b) => a.name.localeCompare(b.name)
  },
  {
    key: 'status',
    label: 'Status',
    width: '100px',
    render: (row) => (
      <span className={cn(
        'text-2xs font-mono px-1.5 py-0.5 rounded border',
        row.status === 'Active'
          ? 'text-green bg-green/10 border-green/20'
          : 'text-red bg-red/10 border-red/20'
      )}>
        {row.status}
      </span>
    ),
    sortFn: (a, b) => a.status.localeCompare(b.status)
  },
  {
    key: 'age',
    label: 'Age',
    width: '80px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>
  },
]

export function NamespacesPage(): React.ReactElement {
  const { activeCluster, setActiveNamespace } = useClusterStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['namespaces', activeCluster],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getNamespaces(activeCluster)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<NamespaceInfo>
      title="Namespaces"
      icon={<Folder size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(ns) => setActiveNamespace(ns.name)}
      rowKey={(ns) => ns.name}
      emptyMessage="No namespaces found"
    />
  )
}
