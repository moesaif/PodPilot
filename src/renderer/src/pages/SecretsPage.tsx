import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { KeyRound } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { SecretInfo } from '@shared/types'

const TYPE_STYLES: Record<string, string> = {
  'Opaque': 'text-text-secondary',
  'kubernetes.io/tls': 'text-green',
  'kubernetes.io/dockerconfigjson': 'text-cyan',
  'kubernetes.io/dockercfg': 'text-cyan',
  'bootstrap.kubernetes.io/token': 'text-yellow',
}

const COLUMNS: Column<SecretInfo>[] = [
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
    width: '220px',
    render: (row) => (
      <span className={cn('font-mono text-xs', TYPE_STYLES[row.type] || 'text-text-secondary')}>
        {row.type}
      </span>
    ),
    sortFn: (a, b) => a.type.localeCompare(b.type)
  },
  {
    key: 'keyCount',
    label: 'Keys',
    width: '70px',
    render: (row) => (
      <span className="text-text-secondary font-mono tabular-nums">
        {row.keyCount}
      </span>
    ),
    sortFn: (a, b) => a.keyCount - b.keyCount
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>
  },
]

export function SecretsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['secrets', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getSecrets(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<SecretInfo>
      title="Secrets"
      icon={<KeyRound size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(s) => openDetail({ kind: 'Secret', name: s.name, namespace: s.namespace })}
      rowKey={(s) => `${s.namespace}/${s.name}`}
    />
  )
}
