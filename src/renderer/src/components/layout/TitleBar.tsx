import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'
import { useClusterStore } from '../../stores/clusterStore'

export function TitleBar(): React.ReactElement {
  const [isMaximized, setIsMaximized] = useState(false)
  const { clusters, activeCluster } = useClusterStore()
  const active = clusters.find((c) => c.id === activeCluster)

  useEffect(() => {
    window.api.window.isMaximized().then(setIsMaximized)
    const unsub = window.api.window.onMaximized(setIsMaximized)
    return unsub
  }, [])

  return (
    <div className="titlebar-drag flex items-center h-10 bg-surface border-b border-border flex-shrink-0 select-none">
      {/* App identity */}
      <div className="flex items-center gap-2 px-4">
        <div className="w-5 h-5 rounded bg-accent flex items-center justify-center">
          <span className="text-white text-2xs font-bold">P</span>
        </div>
        <span className="text-text-primary font-semibold text-sm tracking-tight">PodPilot</span>
      </div>

      {/* Cluster badge */}
      {active && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated border border-border mx-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-slow" />
          <span className="text-text-secondary text-xs font-mono tracking-tight">{active.name}</span>
        </div>
      )}

      {/* Drag region filler */}
      <div className="flex-1" />

      {/* Window controls */}
      <div className="titlebar-no-drag flex items-center">
        <button
          onClick={() => window.api.window.minimize()}
          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.api.window.maximize()}
          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
        >
          {isMaximized ? <Square size={13} /> : <Maximize2 size={13} />}
        </button>
        <button
          onClick={() => window.api.window.close()}
          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-white hover:bg-red transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
