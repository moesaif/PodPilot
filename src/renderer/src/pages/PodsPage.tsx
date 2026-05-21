import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box } from 'lucide-react'
import { ResourceTable, type Column } from '../components/ui/ResourceTable'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { useAIStore } from '../stores/aiStore'
import { getStatusColor, getStatusDot } from '../lib/utils'
import { cn } from '../lib/utils'
import type { PodInfo } from '@shared/types'

const COLUMNS: Column<PodInfo>[] = [
  {
    key: 'name',
    label: 'Name',
    width: '280px',
    render: (row) => (
      <span className="text-text-primary font-mono text-xs">{row.name}</span>
    ),
    sortFn: (a, b) => a.name.localeCompare(b.name)
  },
  {
    key: 'namespace',
    label: 'Namespace',
    width: '120px',
    render: (row) => <span className="text-text-muted font-mono">{row.namespace}</span>,
    sortFn: (a, b) => a.namespace.localeCompare(b.namespace)
  },
  {
    key: 'status',
    label: 'Status',
    width: '120px',
    render: (row) => (
      <div className="flex items-center gap-1.5">
        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', getStatusDot(row.status))} />
        <span className={getStatusColor(row.status)}>{row.status}</span>
      </div>
    ),
    sortFn: (a, b) => a.status.localeCompare(b.status)
  },
  {
    key: 'ready',
    label: 'Ready',
    width: '80px',
    render: (row) => <span className="text-text-secondary font-mono">{row.ready}</span>
  },
  {
    key: 'restarts',
    label: 'Restarts',
    width: '80px',
    render: (row) => (
      <span className={cn('font-mono', row.restarts > 0 ? 'text-yellow' : 'text-text-muted')}>
        {row.restarts}
      </span>
    ),
    sortFn: (a, b) => a.restarts - b.restarts
  },
  {
    key: 'node',
    label: 'Node',
    width: '160px',
    render: (row) => <span className="text-text-muted font-mono text-2xs">{row.node}</span>
  },
  {
    key: 'ip',
    label: 'IP',
    width: '110px',
    render: (row) => <span className="text-text-muted font-mono text-2xs">{row.ip}</span>
  },
  {
    key: 'age',
    label: 'Age',
    width: '60px',
    render: (row) => <span className="text-text-muted font-mono">{row.age}</span>
  },
]

export function PodsPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { openDetail, setAIPanelOpen } = useUIStore()
  const { setContext } = useAIStore()

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['pods', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getPods(activeCluster, activeNamespace)
      if (res.error) throw new Error(res.error)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 15000
  })

  const handleDiagnose = async (pod: PodInfo) => {
    if (!activeCluster) return
    const [logsRes, eventsRes] = await Promise.all([
      window.api.k8s.getPodLogs(activeCluster, pod.namespace, pod.name),
      window.api.k8s.getEvents(activeCluster, pod.namespace)
    ])
    const podEvents = (eventsRes.data || [])
      .filter((e) => e.object.includes(pod.name))
      .map((e) => `[${e.type}] ${e.reason}: ${e.message}`)
      .join('\n')

    setContext({
      clusterName: activeCluster,
      namespace: pod.namespace,
      resourceType: 'Pod',
      resourceName: pod.name,
      logs: logsRes.data || '',
      events: podEvents
    })
    setAIPanelOpen(true)
  }

  return (
    <ResourceTable<PodInfo>
      title="Pods"
      icon={<Box size={14} />}
      data={data}
      columns={COLUMNS}
      loading={isLoading}
      error={error?.message}
      onRefresh={() => refetch()}
      onRowClick={(pod) => openDetail({ kind: 'Pod', name: pod.name, namespace: pod.namespace })}
      onDiagnose={handleDiagnose}
      rowKey={(pod) => `${pod.namespace}/${pod.name}`}
      emptyMessage="No pods found in this namespace"
    />
  )
}
