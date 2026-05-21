import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { CronJobInfo } from '@shared/types'

const COLUMNS: Column<CronJobInfo>[] = [
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
    key: 'schedule',
    label: 'Schedule',
    width: '140px',
    render: (row) => <span className="text-accent font-mono text-xs">{row.schedule}</span>
  },
  {
    key: 'suspend',
    label: 'Suspend',
    width: '90px',
    render: (row) => (
      <span className={cn('text-2xs font-mono px-1.5 py-0.5 rounded border',
        row.suspend
          ? 'text-yellow bg-yellow/10 border-yellow/20'
          : 'text-green bg-green/10 border-green/20'
      )}>
        {row.suspend ? 'Suspended' : 'Active'}
      </span>
    )
  },
  {
    key: 'active',
    label: 'Active',
    width: '70px',
    render: (row) => (
      <span className={cn('font-mono tabular-nums', row.active > 0 ? 'text-accent' : 'text-text-muted')}>
        {row.active}
      </span>
    ),
    sortFn: (a, b) => a.active - b.active
  },
  {
    key: 'lastSchedule',
    label: 'Last Schedule',
    width: '140px',
    render: (row) => <span className="text-text-secondary font-mono text-xs">{row.lastSchedule}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono tabular-nums">{row.age}</span>
  },
]

export function CronJobsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail } = useUIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cronjobs', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getCronJobs(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  return (
    <ResourceTable<CronJobInfo>
      title="CronJobs"
      icon={<Clock size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(cj) => openDetail({ kind: 'CronJob', name: cj.name, namespace: cj.namespace })}
      rowKey={(cj) => `${cj.namespace}/${cj.name}`}
    />
  )
}
