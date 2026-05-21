import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { HardDrive } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { PVCInfo } from '@shared/types'

const STATUS_STYLES: Record<string, string> = {
  Bound: 'text-green',
  Pending: 'text-yellow',
  Lost: 'text-red',
}

const COLUMNS: Column<PVCInfo>[] = [
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
    key: 'status',
    label: 'Status',
    width: '90px',
    render: (row) => (
      <span className={cn('font-mono text-xs', STATUS_STYLES[row.status] || 'text-text-muted')}>
        {row.status}
      </span>
    ),
    sortFn: (a, b) => a.status.localeCompare(b.status)
  },
  {
    key: 'volume',
    label: 'Volume',
    width: '200px',
    render: (row) => <span className="text-text-secondary font-mono text-xs truncate">{row.volume || '—'}</span>
  },
  {
    key: 'capacity',
    label: 'Capacity',
    width: '90px',
    render: (row) => <span className="text-text-primary font-mono tabular-nums">{row.capacity || '—'}</span>,
    sortFn: (a, b) => a.capacity.localeCompare(b.capacity)
  },
  {
    key: 'accessModes',
    label: 'Access',
    width: '120px',
    render: (row) => <span className="text-cyan font-mono text-xs">{row.accessModes}</span>
  },
  {
    key: 'storageClass',
    label: 'Storage Class',
    width: '140px',
    render: (row) => <span className="text-text-secondary font-mono text-xs">{row.storageClass || '—'}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>
  },
]

export function PVCsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pvcs', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getPersistentVolumeClaims(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<PVCInfo>
      title="Persistent Volume Claims"
      icon={<HardDrive size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(pvc) => openDetail({ kind: 'PersistentVolumeClaim', name: pvc.name, namespace: pvc.namespace })}
      rowKey={(pvc) => `${pvc.namespace}/${pvc.name}`}
    />
  )
}
