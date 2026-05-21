import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Box, Layers, Network, Server, AlertCircle, RefreshCw, Globe, FileCode2, KeyRound, Folder } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { useClusterStore } from '../stores/clusterStore'
import { useUIStore } from '../stores/uiStore'
import { cn } from '../lib/utils'
import type { ClusterMetrics, NodeInfo } from '@shared/types'

const DONUT_COLORS: Record<string, string> = {
  Running: '#22c55e',
  Pending: '#eab308',
  Failed: '#ef4444',
  Succeeded: '#3b82f6',
  Unknown: '#4a5568',
}

export function OverviewPage(): React.ReactElement {
  const { activeCluster, activeNamespace } = useClusterStore()
  const { setActiveView } = useUIStore()

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['metrics', activeCluster],
    queryFn: async () => {
      if (!activeCluster) return null
      const res = await window.api.k8s.getClusterMetrics(activeCluster)
      if (res.error) throw new Error(res.error)
      return res.data as ClusterMetrics
    },
    enabled: !!activeCluster,
    refetchInterval: 15000
  })

  const { data: nodes } = useQuery({
    queryKey: ['nodes-overview', activeCluster],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getNodes(activeCluster)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 30000
  })

  const { data: events } = useQuery({
    queryKey: ['events-overview', activeCluster, activeNamespace],
    queryFn: async () => {
      if (!activeCluster) return []
      const res = await window.api.k8s.getEvents(activeCluster, activeNamespace)
      return res.data || []
    },
    enabled: !!activeCluster,
    refetchInterval: 15000
  })

  const warningEvents = events?.filter((e) => e.type === 'Warning').slice(0, 6) || []

  // Prepare donut chart data
  const podStatusData = metrics
    ? Object.entries(metrics.podsByStatus || {})
        .map(([name, value]) => ({ name, value, color: DONUT_COLORS[name] || '#4a5568' }))
        .filter((d) => d.value > 0)
    : []

  // Prepare namespace distribution data (top 8)
  const namespaceData = metrics
    ? Object.entries(metrics.podsByNamespace || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, pods]) => ({ name, pods }))
    : []

  if (!activeCluster) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center">
          <Server size={28} className="text-text-muted" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-text-primary font-semibold">No cluster selected</h2>
          <p className="text-text-muted text-xs">Select a cluster from the sidebar to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-4 max-w-screen-2xl">

        {/* Row 1 — stat cards */}
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-2.5">
          <StatCard icon={<Box size={14} />} label="Pods" value={metrics?.podCount} loading={metricsLoading}
            sub={metrics ? `${metrics.healthyPods} running` : ''} color="blue" onClick={() => setActiveView('pods')} />
          <StatCard icon={<Layers size={14} />} label="Deployments" value={metrics?.deploymentCount} loading={metricsLoading}
            color="purple" onClick={() => setActiveView('deployments')} />
          <StatCard icon={<Server size={14} />} label="Nodes" value={metrics?.nodeCount} loading={metricsLoading}
            color="green" onClick={() => setActiveView('nodes')} />
          <StatCard icon={<Network size={14} />} label="Services" value={metrics?.serviceCount} loading={metricsLoading}
            color="cyan" onClick={() => setActiveView('services')} />
          <StatCard icon={<Globe size={14} />} label="Ingresses" value={undefined} loading={metricsLoading}
            color="orange" onClick={() => setActiveView('ingresses')} small />
          <StatCard icon={<FileCode2 size={14} />} label="ConfigMaps" value={metrics?.configMapCount} loading={metricsLoading}
            color="yellow" onClick={() => setActiveView('configmaps')} small />
          <StatCard icon={<KeyRound size={14} />} label="Secrets" value={metrics?.secretCount} loading={metricsLoading}
            color="red" onClick={() => setActiveView('secrets')} small />
          <StatCard icon={<Folder size={14} />} label="Namespaces" value={metrics?.namespaceCount} loading={metricsLoading}
            color="purple" onClick={() => setActiveView('namespaces')} small />
        </div>

        {/* Row 2 — charts */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* Pod status donut */}
          <div className="xl:col-span-2 bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-primary text-xs font-semibold">Pod Status</h3>
              {metrics && (
                <span className="text-2xs text-text-muted font-mono tabular-nums">{metrics.podCount} total</span>
              )}
            </div>
            {podStatusData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-[140px] h-[140px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={podStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={62}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {podStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#181b22',
                          border: '1px solid #1e2230',
                          borderRadius: '6px',
                          fontSize: '11px',
                          color: '#e2e8f0'
                        }}
                        itemStyle={{ color: '#e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {podStatusData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: entry.color }} />
                        <span className="text-text-secondary text-xs">{entry.name}</span>
                      </div>
                      <span className="text-text-primary font-mono text-xs tabular-nums font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-36 text-text-muted text-xs">
                {metricsLoading ? 'Loading...' : 'No data'}
              </div>
            )}
          </div>

          {/* Namespace distribution */}
          <div className="xl:col-span-3 bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-primary text-xs font-semibold">Pods by Namespace</h3>
              <span className="text-2xs text-text-muted font-mono">{namespaceData.length} namespaces</span>
            </div>
            {namespaceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={namespaceData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2230" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#4a5568', fontFamily: 'JetBrains Mono, Cascadia Code, Consolas, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#4a5568' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#181b22',
                      border: '1px solid #1e2230',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#e2e8f0'
                    }}
                    cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                  />
                  <Bar dataKey="pods" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-36 text-text-muted text-xs">
                {metricsLoading ? 'Loading...' : 'No data'}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 — Node grid */}
        {nodes && nodes.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-text-primary text-xs font-semibold flex items-center gap-2">
                <Server size={12} className="text-text-muted" />
                Nodes
              </h3>
              <button
                onClick={() => setActiveView('nodes')}
                className="text-2xs text-accent hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {nodes.map((node) => (
                <NodeCard key={node.name} node={node} />
              ))}
            </div>
          </div>
        )}

        {/* Row 4 — Warning events */}
        {warningEvents.length > 0 && (
          <div className="bg-surface border border-border rounded-lg">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <h3 className="text-text-primary text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={12} className="text-yellow" />
                Recent Warnings
              </h3>
              <button
                onClick={() => setActiveView('events')}
                className="text-2xs text-accent hover:underline"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-border/40">
              {warningEvents.map((evt, i) => (
                <div key={i} className="px-4 py-2.5 flex items-start gap-3 hover:bg-elevated/50 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-2xs text-text-muted font-mono truncate max-w-[160px]">{evt.object}</span>
                      <span className="text-2xs text-yellow font-medium flex-shrink-0">{evt.reason}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">{evt.message}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {evt.count > 1 && (
                      <span className="text-2xs text-text-muted font-mono tabular-nums bg-elevated px-1.5 py-0.5 rounded">×{evt.count}</span>
                    )}
                    <span className="text-2xs text-text-muted font-mono">{evt.lastTime ? new Date(evt.lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat card
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | undefined
  loading?: boolean
  sub?: string
  color: 'blue' | 'green' | 'purple' | 'cyan' | 'yellow' | 'red' | 'orange'
  onClick?: () => void
  small?: boolean
}

const colorMap = {
  blue:   { text: 'text-accent',   bg: 'bg-accent/[0.08]',  border: 'border-accent/15',  dot: 'bg-accent' },
  green:  { text: 'text-green',    bg: 'bg-green/[0.08]',   border: 'border-green/15',   dot: 'bg-green' },
  purple: { text: 'text-purple',   bg: 'bg-purple/[0.08]',  border: 'border-purple/15',  dot: 'bg-purple' },
  cyan:   { text: 'text-cyan',     bg: 'bg-cyan/[0.08]',    border: 'border-cyan/15',    dot: 'bg-cyan' },
  yellow: { text: 'text-yellow',   bg: 'bg-yellow/[0.08]',  border: 'border-yellow/15',  dot: 'bg-yellow' },
  red:    { text: 'text-red',      bg: 'bg-red/[0.08]',     border: 'border-red/15',     dot: 'bg-red' },
  orange: { text: 'text-orange',   bg: 'bg-orange/[0.08]',  border: 'border-orange/15',  dot: 'bg-orange' },
}

function StatCard({ icon, label, value, loading, sub, color, onClick, small }: StatCardProps) {
  const c = colorMap[color]
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-left bg-surface border border-border rounded-lg hover:border-border hover:bg-elevated transition-all group',
        small ? 'p-3' : 'p-4'
      )}
    >
      <div className={cn('inline-flex p-1.5 rounded-md mb-2.5', c.bg)}>
        <span className={c.text}>{icon}</span>
      </div>
      <div className={cn('font-bold font-mono tabular-nums mb-0.5 leading-none', c.text, small ? 'text-xl' : 'text-2xl')}>
        {loading ? <span className="text-text-muted">—</span> : (value ?? '—')}
      </div>
      <div className="text-text-secondary text-xs font-medium">{label}</div>
      {sub && <div className="text-text-muted text-2xs mt-0.5">{sub}</div>}
    </button>
  )
}

// Node card
function NodeCard({ node }: { node: NodeInfo }) {
  const isReady = node.status === 'Ready'
  const roles = node.roles.split(',').filter(Boolean)

  return (
    <div className={cn(
      'rounded-md border p-3 space-y-2',
      isReady ? 'border-border bg-elevated' : 'border-red/20 bg-red/[0.04]'
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-text-primary font-mono text-xs font-medium truncate">{node.name}</span>
        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isReady ? 'bg-green' : 'bg-red')} />
      </div>
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => (
          <span key={role} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted">
            {role}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <div className="text-2xs text-text-muted mb-0.5">CPU</div>
          <div className="text-xs font-mono text-text-secondary">{node.cpu}</div>
        </div>
        <div>
          <div className="text-2xs text-text-muted mb-0.5">Memory</div>
          <div className="text-xs font-mono text-text-secondary">{formatMemory(node.memory)}</div>
        </div>
      </div>
      <div className="text-2xs text-text-muted font-mono truncate">{node.version}</div>
    </div>
  )
}

function formatMemory(raw: string): string {
  if (!raw) return '—'
  const ki = parseInt(raw)
  if (isNaN(ki)) return raw
  const gb = ki / (1024 * 1024)
  return gb >= 1 ? `${gb.toFixed(0)}Gi` : `${(ki / 1024).toFixed(0)}Mi`
}
