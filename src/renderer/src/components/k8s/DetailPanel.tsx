import React, { useState, useEffect } from 'react'
import { X, Code2, FileText, AlertCircle, Stethoscope, Copy, Check } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useClusterStore } from '../../stores/clusterStore'
import { useAIStore } from '../../stores/aiStore'
import { cn } from '../../lib/utils'

type TabId = 'yaml' | 'logs' | 'events'

export function DetailPanel(): React.ReactElement | null {
  const { detailPanel, closeDetail, setAIPanelOpen } = useUIStore()
  const { activeCluster } = useClusterStore()
  const { setContext } = useAIStore()
  const [tab, setTab] = useState<TabId>('yaml')
  const [yaml, setYaml] = useState<string | null>(null)
  const [logs, setLogs] = useState<string | null>(null)
  const [events, setEvents] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!detailPanel || !activeCluster) return
    setYaml(null)
    setLogs(null)
    setEvents(null)
    setTab('yaml')
    loadYaml()
  }, [detailPanel, activeCluster])

  const loadYaml = async () => {
    if (!detailPanel || !activeCluster) return
    setLoading(true)
    const res = await window.api.k8s.getResourceYaml(activeCluster, detailPanel.namespace, detailPanel.kind, detailPanel.name)
    setYaml(res.error ? `Error: ${res.error}` : res.data)
    setLoading(false)
  }

  const loadLogs = async () => {
    if (!detailPanel || !activeCluster || detailPanel.kind !== 'Pod') return
    setLoading(true)
    const res = await window.api.k8s.getPodLogs(activeCluster, detailPanel.namespace, detailPanel.name)
    setLogs(res.error ? `Error: ${res.error}` : (res.data || '(no logs)'))
    setLoading(false)
  }

  const loadEvents = async () => {
    if (!detailPanel || !activeCluster) return
    setLoading(true)
    const res = await window.api.k8s.getEvents(activeCluster, detailPanel.namespace)
    const filtered = (res.data || [])
      .filter((e) => e.object.toLowerCase().includes(detailPanel.name.toLowerCase()))
      .map((e) => `[${e.type}] ${e.reason}: ${e.message}`)
      .join('\n')
    setEvents(filtered || '(no events)')
    setLoading(false)
  }

  const handleTabChange = (t: TabId) => {
    setTab(t)
    if (t === 'logs' && !logs) loadLogs()
    if (t === 'events' && !events) loadEvents()
  }

  const diagnose = async () => {
    if (!detailPanel || !activeCluster) return
    if (!logs) await loadLogs()
    if (!events) await loadEvents()
    setContext({
      clusterName: activeCluster,
      namespace: detailPanel.namespace,
      resourceType: detailPanel.kind,
      resourceName: detailPanel.name,
      logs: logs || '',
      events: events || '',
      yaml: yaml || ''
    })
    setAIPanelOpen(true)
  }

  const copy = async () => {
    const content = tab === 'yaml' ? yaml : tab === 'logs' ? logs : events
    if (content) {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  if (!detailPanel) return null

  const TABS: { id: TabId; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: 'yaml', label: 'YAML', icon: <Code2 size={12} />, show: true },
    { id: 'logs', label: 'Logs', icon: <FileText size={12} />, show: detailPanel.kind === 'Pod' },
    { id: 'events', label: 'Events', icon: <AlertCircle size={12} />, show: true },
  ]

  const content = tab === 'yaml' ? yaml : tab === 'logs' ? logs : events

  return (
    <div className="flex flex-col w-[480px] flex-shrink-0 border-l border-border bg-surface animate-slide-in-right">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xs text-text-muted bg-elevated border border-border px-1.5 py-0.5 rounded font-mono">
              {detailPanel.kind}
            </span>
            <h3 className="text-text-primary font-mono text-sm font-medium">{detailPanel.name}</h3>
          </div>
          {detailPanel.namespace && (
            <p className="text-text-muted text-2xs mt-0.5">namespace: {detailPanel.namespace}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={diagnose}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-purple/10 border border-purple/20 text-purple hover:bg-purple/20 transition-colors text-xs"
          >
            <Stethoscope size={12} />
            Diagnose
          </button>
          <button onClick={closeDetail} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors ml-1">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-4 gap-1">
        {TABS.filter((t) => t.show).map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={copy}
          className="p-1.5 text-text-muted hover:text-text-primary transition-colors self-center"
          title="Copy"
        >
          {copied ? <Check size={12} className="text-green" /> : <Copy size={12} />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-text-muted text-xs">Loading...</div>
        ) : content ? (
          <pre className="text-2xs font-mono text-text-secondary p-4 whitespace-pre-wrap leading-relaxed">
            {content}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-muted text-xs">
            Click a tab to load content
          </div>
        )}
      </div>
    </div>
  )
}
