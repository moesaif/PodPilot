import React, { useState } from 'react'
import { X, ServerCrash, CheckCircle2, AlertCircle, Loader2, FileUp, ClipboardPaste } from 'lucide-react'
import { useClusterStore } from '../../stores/clusterStore'
import { cn } from '../../lib/utils'

interface ConnectClusterModalProps {
  onClose: () => void
}

type Step = 'select' | 'paste' | 'testing' | 'done'

export function ConnectClusterModal({ onClose }: ConnectClusterModalProps) {
  const { clusters, setActiveCluster } = useClusterStore()
  const [step, setStep] = useState<Step>('select')
  const [pastedContent, setPastedContent] = useState('')
  const [testingCtx, setTestingCtx] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; version?: string; error?: string }>>({})
  const [importedContexts, setImportedContexts] = useState<string[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [pasteError, setPasteError] = useState<string | null>(null)

  const handleTestConnection = async (contextId: string) => {
    setTestingCtx(contextId)
    const res = await window.api.k8s.testConnection(contextId)
    setTestResults((prev) => ({ ...prev, [contextId]: res.data || { ok: false, error: res.error } }))
    setTestingCtx(null)
  }

  const handleSelectCluster = (contextId: string) => {
    setActiveCluster(contextId)
    onClose()
  }

  const handleImportPaste = async () => {
    setPasteError(null)
    if (!pastedContent.trim()) {
      setPasteError('Please paste your kubeconfig YAML')
      return
    }
    const res = await window.api.k8s.importKubeconfig(pastedContent)
    if (res.error) {
      setPasteError(`Failed to parse kubeconfig: ${res.error}`)
      return
    }
    const newCtxs = res.data?.contexts || []
    setImportedContexts(newCtxs)

    // Refresh cluster list
    const ctxRes = await window.api.k8s.getContexts()
    if (ctxRes.data) {
      const { useClusters } = await import('../../stores/clusterStore').then(m => m)
      // Reload clusters in store by re-fetching
      window.dispatchEvent(new CustomEvent('clusters-updated'))
    }

    if (newCtxs.length > 0) {
      setStep('done')
    } else {
      setPasteError('No new contexts found in provided kubeconfig')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-[560px] max-h-[80vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <ServerCrash size={15} className="text-accent" />
            </div>
            <div>
              <h2 className="text-text-primary font-semibold text-sm">Connect Cluster</h2>
              <p className="text-text-muted text-2xs">Add a Kubernetes cluster to PodPilot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-hover transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {(step === 'select' || step === 'testing') && (
            <>
              {/* Existing contexts */}
              {clusters.length > 0 && (
                <div>
                  <h3 className="text-text-secondary text-xs font-medium mb-2">Detected from kubeconfig</h3>
                  <div className="space-y-1.5">
                    {clusters.map((cluster) => {
                      const result = testResults[cluster.id]
                      const isTesting = testingCtx === cluster.id
                      return (
                        <div
                          key={cluster.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-accent/30 hover:bg-elevated transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-text-primary font-mono text-xs font-medium truncate">{cluster.name}</div>
                            <div className="text-text-muted text-2xs font-mono truncate mt-0.5">{cluster.server}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {result && (
                              <div className="flex items-center gap-1">
                                {result.ok
                                  ? <><CheckCircle2 size={12} className="text-green" /><span className="text-2xs text-green font-mono">v{result.version}</span></>
                                  : <><AlertCircle size={12} className="text-red" /><span className="text-2xs text-red">unreachable</span></>
                                }
                              </div>
                            )}
                            <button
                              onClick={() => handleTestConnection(cluster.id)}
                              disabled={isTesting}
                              className="text-2xs px-2 py-1 rounded border border-border hover:border-accent/40 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                            >
                              {isTesting ? <Loader2 size={10} className="animate-spin" /> : 'Test'}
                            </button>
                            <button
                              onClick={() => handleSelectCluster(cluster.id)}
                              className="text-2xs px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors font-medium"
                            >
                              Connect
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-text-muted text-2xs">or import</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Import options */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setStep('paste')}
                  className="flex items-center gap-3 p-3.5 rounded-lg border border-border hover:border-accent/30 hover:bg-elevated transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-md bg-purple/10 border border-purple/20 flex items-center justify-center flex-shrink-0">
                    <ClipboardPaste size={14} className="text-purple" />
                  </div>
                  <div>
                    <div className="text-text-primary text-xs font-medium">Paste kubeconfig</div>
                    <div className="text-text-muted text-2xs">Import contexts from pasted YAML content</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {step === 'paste' && (
            <div className="space-y-3">
              <button
                onClick={() => setStep('select')}
                className="text-2xs text-accent hover:underline flex items-center gap-1"
              >
                ← Back
              </button>
              <div>
                <label className="text-text-secondary text-xs font-medium block mb-1.5">Kubeconfig YAML</label>
                <textarea
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Paste your kubeconfig YAML here..."
                  rows={12}
                  className="w-full bg-base border border-border rounded-lg px-3 py-2.5 text-xs font-mono text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/50 resize-none leading-relaxed"
                  style={{ userSelect: 'text' }}
                />
              </div>
              {pasteError && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red/10 border border-red/20 text-xs text-red">
                  <AlertCircle size={12} />
                  {pasteError}
                </div>
              )}
              <button
                onClick={handleImportPaste}
                className="w-full py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors"
              >
                Import Contexts
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green/10 border border-green/20 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} className="text-green" />
              </div>
              <div>
                <div className="text-text-primary font-semibold text-sm">Imported successfully</div>
                <div className="text-text-muted text-xs mt-1">
                  Added {importedContexts.length} context{importedContexts.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="space-y-1">
                {importedContexts.map((ctx) => (
                  <div key={ctx} className="flex items-center justify-between px-3 py-2 rounded-lg bg-elevated border border-border">
                    <span className="text-text-primary font-mono text-xs">{ctx}</span>
                    <button
                      onClick={() => handleSelectCluster(ctx)}
                      className="text-2xs px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {importError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red/10 border border-red/20 text-xs text-red">
              <AlertCircle size={12} />
              {importError}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
