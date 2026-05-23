import { useState, useEffect } from 'react'
import { useTheme, themes } from '../theme'
import { useChatStore } from '../ai/store/chatStore'
import { AI_PROVIDERS, getProvider } from '../ai/lib/config'
import { saveApiKey, loadAllApiKeys } from '../ai/lib/keychain'
import { getBindings } from '../shortcuts'
import { useTerminalPrefs } from '../terminal/lib/useTerminalPrefs'
import type { AiProviderId } from '../ai/lib/config'

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20]

export function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  const { provider, model, apiKeys, setProvider, setModel } = useChatStore()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [keysLoaded, setKeysLoaded] = useState(false)
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('flame-ade:font-size') || '14', 10)
  })
  const availableApps = useTerminalPrefs((s) => s.availableApps)
  const selectedAppId = useTerminalPrefs((s) => s.selectedAppId)
  const setSelectedApp = useTerminalPrefs((s) => s.setSelectedApp)

  useEffect(() => {
    if (!keysLoaded) {
      loadAllApiKeys().then(() => setKeysLoaded(true))
    }
  }, [keysLoaded])

  const handleFontSizeChange = (size: number) => {
    setFontSize(size)
    localStorage.setItem('flame-ade:font-size', String(size))
  }

  return (
    <div className="flex h-full flex-col bg-background p-4 overflow-auto">
      <h2 className="text-sm font-semibold text-foreground mb-4">Settings</h2>

      <div className="space-y-4">
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-foreground">Terminal</h3>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Default Terminal App</label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
            >
              {availableApps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Default Shell</label>
            <select
              value={localStorage.getItem('flame-ade:shell') || '/bin/zsh'}
              onChange={(e) => localStorage.setItem('flame-ade:shell', e.target.value)}
              className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
            >
              <option value="/bin/zsh">Zsh (/bin/zsh)</option>
              <option value="/bin/bash">Bash (/bin/bash)</option>
              <option value="/bin/sh">Sh (/bin/sh)</option>
              <option value="/opt/homebrew/bin/fish">Fish</option>
            </select>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-foreground">Appearance</h3>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
            >
              {Object.keys(themes).map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Font Size</label>
            <select
              value={fontSize}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
              className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-foreground">AI Provider</h3>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AiProviderId)}
              className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
            >
              {getProvider(provider).models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {getProvider(provider).needsApiKey && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">API Key</label>
              <div className="flex gap-1">
                <input
                  type="password"
                  value={apiKeyInput || apiKeys[provider] || ''}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={apiKeys[provider] ? '••••••••' : 'sk-...'}
                  className="flex-1 bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
                />
                <button
                  onClick={() => saveApiKey(provider, apiKeyInput)}
                  className="text-xs bg-primary text-white rounded px-2 py-1"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-foreground">Keyboard Shortcuts</h3>
          <div className="text-[10px] text-muted-foreground space-y-1">
            {getBindings().map((b, i) => (
              <div key={i} className="flex justify-between">
                <span>{b.description}</span>
                <span className="font-mono text-foreground/70">
                  {b.meta ? '⌘' : ''}{b.shift ? '⇧' : ''}{b.ctrl ? '^' : ''}{b.alt ? '⌥' : ''}{b.key === ' ' ? 'Space' : b.key === 'ArrowLeft' ? '←' : b.key === 'ArrowRight' ? '→' : b.key.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-foreground">About</h3>
          <p className="text-[10px] text-muted-foreground">
            Flame ADE v1.0.0 — AI-native Agentic Development Environment
          </p>
          <p className="text-[10px] text-muted-foreground">
            Built with Tauri 2 + Rust + React 19. Default AI: OpenCode Zen.
          </p>
        </section>
      </div>
    </div>
  )
}
