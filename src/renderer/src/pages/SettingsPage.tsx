import React, { useEffect, useState } from 'react'
import { Settings, Key, Eye, EyeOff, CheckCircle } from 'lucide-react'

export function SettingsPage(): React.ReactElement {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.api.ai.getApiKey().then(setApiKey)
  }, [])

  const save = async () => {
    await window.api.ai.setApiKey(apiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-text-primary font-semibold text-base flex items-center gap-2">
          <Settings size={16} className="text-text-muted" />
          Settings
        </h1>
        <p className="text-text-muted text-xs mt-1">Configure PodPilot preferences</p>
      </div>

      {/* AI Configuration */}
      <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
        <h2 className="text-text-primary font-medium text-xs flex items-center gap-2">
          <Key size={13} className="text-purple" />
          AI Configuration
        </h2>

        <div>
          <label className="text-text-secondary text-xs mb-1.5 block">
            Anthropic API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-elevated border border-border rounded px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-purple/50 pr-8 transition-colors font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          <p className="text-text-muted text-2xs mt-1">
            Used for AI Assistant, pod diagnostics, and YAML generation.
            Get your key at console.anthropic.com
          </p>
        </div>

        <button
          onClick={save}
          className="flex items-center gap-2 px-4 py-2 rounded bg-purple/80 text-white hover:bg-purple transition-colors text-xs font-medium"
        >
          {saved ? (
            <>
              <CheckCircle size={13} />
              Saved!
            </>
          ) : (
            'Save API Key'
          )}
        </button>
      </div>

      {/* About */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <h2 className="text-text-primary font-medium text-xs mb-2">About PodPilot</h2>
        <div className="space-y-1 text-xs text-text-muted">
          <p>Version: 0.1.0</p>
          <p>AI Model: claude-sonnet-4-6</p>
          <p>Built with Electron + React + @kubernetes/client-node</p>
        </div>
      </div>
    </div>
  )
}
