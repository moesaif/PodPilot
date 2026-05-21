import React, { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { useClusterStore } from '../stores/clusterStore'
import '@xterm/xterm/css/xterm.css'

const TERM_ID = 'main-terminal'

export function TerminalPage(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const { activeCluster } = useClusterStore()

  useEffect(() => {
    if (!containerRef.current) return

    const term = new XTerm({
      theme: {
        background: '#0a0b0e',
        foreground: '#e2e8f0',
        cursor: '#3b82f6',
        cursorAccent: '#0a0b0e',
        selectionBackground: 'rgba(59, 130, 246, 0.3)',
        black: '#1e2230',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e2e8f0',
        brightBlack: '#4a5568',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fde047',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f8fafc',
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.5,
      cursorStyle: 'bar',
      cursorBlink: true,
      allowTransparency: true,
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)
    setTimeout(() => fitAddon.fit(), 50)

    termRef.current = term
    fitAddonRef.current = fitAddon

    let unsubData: (() => void) | null = null
    let unsubExit: (() => void) | null = null
    let resizeObserver: ResizeObserver | null = null
    let ptyStarted = false

    const initPty = async () => {
      const createResult = await window.api.terminal.create(TERM_ID, activeCluster || undefined)
      if (createResult && 'error' in createResult) {
        term.write(`\r\n\x1b[31mTerminal unavailable:\x1b[0m ${(createResult as { error: string }).error}\r\n`)
        term.write('\x1b[33mTo enable:\x1b[0m npm run rebuild (requires VS Build Tools)\r\n')
        return
      }

      ptyStarted = true

      unsubData = window.api.terminal.onData(TERM_ID, (data) => term.write(data))
      unsubExit = window.api.terminal.onExit(TERM_ID, () => {
        term.write('\r\n\x1b[33m[Process exited]\x1b[0m\r\n')
      })

      term.onData((data) => window.api.terminal.write(TERM_ID, data))

      if (containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          fitAddon.fit()
          window.api.terminal.resize(TERM_ID, term.cols, term.rows)
        })
        resizeObserver.observe(containerRef.current)
      }
    }

    initPty()

    return () => {
      unsubData?.()
      unsubExit?.()
      resizeObserver?.disconnect()
      if (ptyStarted) window.api.terminal.destroy(TERM_ID)
      term.dispose()
    }
  }, [])

  return (
    <div className="flex flex-col h-full bg-base">
      <div className="flex items-center px-4 py-2 border-b border-border bg-surface flex-shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green/70" />
        </div>
        <span className="text-text-muted text-xs mx-auto font-mono">
          {activeCluster ? `kubectl — ${activeCluster}` : 'Terminal'}
        </span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ padding: '8px' }} />
    </div>
  )
}
