import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, Trash2, Zap, FileCode, Search, Activity, Loader2, CheckCircle2, Wrench } from 'lucide-react'
import { useAIStore } from '../stores/aiStore'
import { useClusterStore } from '../stores/clusterStore'
import { cn, renderMarkdown } from '../lib/utils'
import { Logo } from '../components/ui/Logo'

type ToolCall = { id: string; name: string; input: Record<string, unknown>; status: 'running' | 'done' }

const TOOL_LABELS: Record<string, string> = {
  get_cluster_overview: 'cluster overview',
  get_pods: 'pods',
  get_nodes: 'nodes',
  get_events: 'events',
  get_pod_logs: 'pod logs',
  get_deployments: 'deployments',
  get_resource_yaml: 'resource YAML',
  get_services: 'services',
}

function ToolCallBadge({ tc }: { tc: ToolCall }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-2xs font-medium transition-all',
      tc.status === 'running'
        ? 'bg-purple/10 border-purple/20 text-purple'
        : 'bg-elevated border-border text-text-muted'
    )}>
      {tc.status === 'running'
        ? <Loader2 size={9} className="animate-spin" />
        : <CheckCircle2 size={9} className="text-green" />
      }
      <Wrench size={8} className={tc.status === 'running' ? 'text-purple' : 'text-text-muted'} />
      <span>{tc.status === 'running' ? 'Fetching ' : ''}{TOOL_LABELS[tc.name] ?? tc.name.replace(/_/g, ' ')}</span>
    </div>
  )
}

const QUICK_ACTIONS = [
  { icon: <Activity size={13} />, label: 'Health check', prompt: 'Analyze my cluster health and give me a prioritized list of issues and recommendations' },
  { icon: <Search size={13} />, label: 'Find issues', prompt: 'What pods are unhealthy or have high restart counts? What might be causing this?' },
  { icon: <FileCode size={13} />, label: 'Generate YAML', prompt: 'Generate a production-ready Deployment YAML for a Node.js app with resource limits, health checks, and rolling updates' },
  { icon: <Zap size={13} />, label: 'Optimize', prompt: 'Review my cluster configuration and suggest resource optimization improvements' },
]

export function AIFullPage(): React.ReactElement {
  const { messages, streaming, streamingContent, addMessage, setStreaming, appendStreamingContent, finalizeStream, clearMessages, context } = useAIStore()
  const { activeCluster } = useClusterStore()
  const [input, setInput] = useState('')
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingDelta = useRef('')
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages])

  useEffect(() => {
    if (streaming) messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [streamingContent, toolCalls])

  useEffect(() => {
    const flush = () => {
      if (pendingDelta.current) {
        appendStreamingContent(pendingDelta.current)
        pendingDelta.current = ''
      }
      rafId.current = null
    }
    const unsub = window.api.ai.onStream(({ delta, done }) => {
      if (!done) {
        pendingDelta.current += delta
        if (!rafId.current) rafId.current = requestAnimationFrame(flush)
      } else {
        if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null }
        if (pendingDelta.current) { appendStreamingContent(pendingDelta.current); pendingDelta.current = '' }
        finalizeStream()
        setToolCalls([])
      }
    })
    return () => { unsub(); if (rafId.current) cancelAnimationFrame(rafId.current) }
  }, [])

  useEffect(() => {
    const unsub = window.api.ai.onToolCall((data) => {
      setToolCalls((prev) => {
        const existing = prev.findIndex((t) => t.id === data.id)
        if (existing >= 0) {
          const next = [...prev]
          next[existing] = data
          return next
        }
        return [...prev, data]
      })
    })
    return unsub
  }, [])

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || streaming) return
    setInput('')
    setToolCalls([])
    const userMsg = { role: 'user' as const, content: msg, timestamp: Date.now() }
    addMessage(userMsg)
    setStreaming(true)
    const allMessages = [...messages, userMsg]
    const res = await window.api.ai.chat(allMessages, { ...context, clusterName: activeCluster || '' })
    if (res.error) {
      finalizeStream()
      setToolCalls([])
      addMessage({ role: 'assistant', content: `Error: ${res.error}`, timestamp: Date.now() })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple/20 border border-purple/30 flex items-center justify-center">
            <Bot size={16} className="text-purple" />
          </div>
          <div>
            <h1 className="text-text-primary font-semibold text-sm">AI Assistant</h1>
            <p className="text-text-muted text-2xs">Powered by Claude</p>
          </div>
          {streaming && (
            <div className="flex gap-0.5 ml-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={clearMessages} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors text-xs">
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ userSelect: 'text', cursor: 'default' }}>
        {messages.length === 0 && !streaming && (
          <div className="max-w-2xl mx-auto space-y-6 pt-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Logo size={64} />
              </div>
              <h2 className="text-text-primary font-semibold text-base mb-1">What can I help you with?</h2>
              <p className="text-text-muted text-xs">Ask about your cluster, debug issues, generate manifests, or get recommendations</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.prompt)}
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border hover:border-purple/30 hover:bg-elevated transition-all text-left group"
                >
                  <span className="text-purple mt-0.5 group-hover:scale-110 transition-transform">{action.icon}</span>
                  <div>
                    <div className="text-text-primary text-xs font-medium">{action.label}</div>
                    <div className="text-text-muted text-2xs mt-0.5 line-clamp-2">{action.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-4 w-full">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded bg-purple/20 border border-purple/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-purple" />
                </div>
              )}
              <div className={cn(
                'rounded-lg px-4 py-3 max-w-[85%]',
                msg.role === 'user'
                  ? 'bg-accent/20 border border-accent/30 text-text-primary'
                  : 'bg-surface border border-border'
              )}>
                {msg.role === 'assistant' ? (
                  <div className="markdown-content text-xs" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                ) : (
                  <p className="ai-text text-xs whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {streaming && (
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded bg-purple/20 border border-purple/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={12} className="text-purple" />
              </div>
              <div className="flex-1 space-y-2 max-w-[85%]">
                {toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {toolCalls.map((tc) => <ToolCallBadge key={tc.id} tc={tc} />)}
                  </div>
                )}
                {streamingContent ? (
                  <div className="rounded-lg px-4 py-3 bg-surface border border-border">
                    <p className="ai-text text-xs whitespace-pre-wrap leading-relaxed text-text-primary">{streamingContent}<span className="inline-block w-1 h-3.5 bg-purple ml-0.5 animate-pulse align-middle" /></p>
                  </div>
                ) : toolCalls.length === 0 ? (
                  <div className="flex gap-1 pt-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-surface border border-border rounded-xl px-4 py-3 focus-within:border-purple/40 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your cluster..."
              rows={1}
              disabled={streaming}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none outline-none max-h-32 leading-relaxed disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className="p-2 rounded-lg bg-purple text-white hover:bg-purple/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-2xs text-text-muted mt-2 text-center">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  )
}
