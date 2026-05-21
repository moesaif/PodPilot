import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { PlayCircle } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { JobInfo } from '@shared/types'

const STATUS_STYLES: Record<string, string> = {
  Complete: 'text-green bg-green/10 border-green/20',
  Running: 'text-accent bg-accent/10 border-accent/20',
  Failed: 'text-red bg-red/10 border-red/20',
  Suspended: 'text-text-muted bg-elevated border-border'
}

const COLUMNS: Column<JobInfo>[] = [
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
    key: 'status',
    label: 'Status',
    width: '100px',
    render: (row) => (
      <span className={cn('text-2xs font-mono px-1.5 py-0.5 rounded border', STATUS_STYLES[row.status] || STATUS_STYLES.Running)}>
        {row.status}
      </span>
    ),
    sortFn: (a, b) => a.status.localeCompare(b.status)
  },
  {
    key: 'completions',
    label: 'Completions',
    width: '110px',
    render: (row) => <span className="text-text-secondary font-mono tabular-nums">{row.completions}</span>
  },
  {
    key: 'duration',
    label: 'Duration',
    width: '120px',
    render: (row) => <span className="text-text-secondary font-mono tabular-nums">{row.duration}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>
  },
]

export function JobsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getJobs(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 15000
  })

  return (
    <ResourceTable<JobInfo>
      title="Jobs"
      icon={<PlayCircle size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(job) => openDetail({ kind: 'Job', name: job.name, namespace: job.namespace })}
      rowKey={(job) => `${job.namespace}/${job.name}`}
    />
  )
}
