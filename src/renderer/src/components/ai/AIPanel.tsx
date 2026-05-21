import React, { useState, useRef, useEffect } from 'react'
import { Send, X, Bot, Trash2, Cpu, Loader2, CheckCircle2, Wrench } from 'lucide-react'
import { useAIStore } from '../../stores/aiStore'
import { useClusterStore } from '../../stores/clusterStore'
import { cn } from '../../lib/utils'

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
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-2xs font-medium transition-all',
      tc.status === 'running'
        ? 'bg-purple/10 border-purple/20 text-purple'
        : 'bg-elevated border-border text-text-muted'
    )}>
      {tc.status === 'running'
        ? <Loader2 size={8} className="animate-spin" />
        : <CheckCircle2 size={8} className="text-green" />
      }
      <Wrench size={7} className={tc.status === 'running' ? 'text-purple' : 'text-text-muted'} />
      <span>{tc.status === 'running' ? 'Fetching ' : ''}{TOOL_LABELS[tc.name] ?? tc.name.replace(/_/g, ' ')}</span>
    </div>
  )
}

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

const SUGGESTED_PROMPTS = [
  'Why is this pod in CrashLoopBackOff?',
  'Generate a deployment YAML for nginx with 3 replicas',
  'What kubectl command scales this deployment to 5?',
  'Analyze my cluster health and give recommendations'
]

export function AIPanel({ onClose }: { onClose: () => void }): React.ReactElement {
  const { messages, streaming, streamingContent, addMessage, setStreaming, appendStreamingContent, finalizeStream, clearMessages, context } = useAIStore()
  const { activeCluster } = useClusterStore()
  const [input, setInput] = useState('')
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, toolCalls])

  useEffect(() => {
    const unsub = window.api.ai.onStream(({ delta, done }) => {
      if (!done) appendStreamingContent(delta)
      else { finalizeStream(); setToolCalls([]) }
    })
    return unsub
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

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    setToolCalls([])
    const userMsg = { role: 'user' as const, content: text, timestamp: Date.now() }
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border w-96 flex-shrink-0 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded bg-purple/20 border border-purple/30 flex items-center justify-center">
            <Bot size={13} className="text-purple" />
          </div>
          <span className="text-text-primary font-semibold text-xs">AI Assistant</span>
          {streaming && (
            <div className="flex gap-0.5 ml-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-purple animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={clearMessages} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors" title="Clear">
              <Trash2 size={12} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Context badge */}
      {context.resourceName && (
        <div className="px-3 py-1.5 bg-purple/5 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Cpu size={10} className="text-purple" />
            <span className="text-2xs text-purple">
              Context: {context.resourceType}/{context.resourceName}
              {context.namespace && ` (${context.namespace})`}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-xl bg-purple/10 border border-purple/20 flex items-center justify-center mx-auto mb-2">
                <Bot size={20} className="text-purple" />
              </div>
              <p className="text-text-secondary text-xs">Ask anything about your cluster</p>
            </div>
            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                  className="w-full text-left px-3 py-2 rounded bg-elevated border border-border text-xs text-text-secondary hover:text-text-primary hover:border-purple/30 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded bg-purple/20 border border-purple/30 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <Bot size={11} className="text-purple" />
              </div>
            )}
            <div className={cn(
              'max-w-[85%] rounded-lg px-3 py-2',
              msg.role === 'user'
                ? 'bg-accent/20 border border-accent/30 text-text-primary text-xs'
                : 'bg-elevated border border-border'
            )}>
              {msg.role === 'assistant' ? (
                <div
                  className="markdown-content text-xs"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Streaming */}
        {streaming && (
          <div className="flex justify-start">
            <div className="w-5 h-5 rounded bg-purple/20 border border-purple/30 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
              <Bot size={11} className="text-purple" />
            </div>
            <div className="flex-1 space-y-1.5 max-w-[85%]">
              {toolCalls.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {toolCalls.map((tc) => <ToolCallBadge key={tc.id} tc={tc} />)}
                </div>
              )}
              {streamingContent ? (
                <div className="rounded-lg px-3 py-2 bg-elevated border border-border">
                  <div className="markdown-content text-xs" dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }} />
                  <span className="inline-block w-1 h-3 bg-purple ml-0.5 animate-pulse" />
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

      {/* Input */}
      <div className="border-t border-border p-2.5">
        <div className="flex items-end gap-2 bg-elevated border border-border rounded-lg px-3 py-2 focus-within:border-purple/40 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your cluster..."
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted resize-none outline-none max-h-24 leading-relaxed disabled:opacity-50"
            style={{ minHeight: '20px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="p-1.5 rounded bg-purple/80 text-white hover:bg-purple transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
        <p className="text-2xs text-text-muted mt-1.5 text-center">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  )
}
