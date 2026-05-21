import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileCode2 } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import type { ConfigMapInfo } from '@shared/types'

const COLUMNS: Column<ConfigMapInfo>[] = [
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
    key: 'dataKeys',
    label: 'Keys',
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.dataKeys.slice(0, 4).map((key) => (
          <span key={key} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-elevated border border-border text-text-secondary">
            {key}
          </span>
        ))}
        {row.dataKeys.length > 4 && (
          <span className="text-2xs text-text-muted font-mono">+{row.dataKeys.length - 4}</span>
        )}
        {row.dataKeys.length === 0 && (
          <span className="text-2xs text-text-muted">empty</span>
        )}
      </div>
    )
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>,
    sortFn: (a, b) => a.age.localeCompare(b.age)
  },
]

export function ConfigMapsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['configmaps', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getConfigMaps(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<ConfigMapInfo>
      title="ConfigMaps"
      icon={<FileCode2 size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(cm) => openDetail({ kind: 'ConfigMap', name: cm.name, namespace: cm.namespace })}
      rowKey={(cm) => `${cm.namespace}/${cm.name}`}
    />
  )
}
