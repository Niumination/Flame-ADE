import { useState, useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { useAiWindowStore } from '../store/aiWindowStore'
import { AI_PROVIDERS, getProvider } from '../lib/config'
import { saveApiKey, loadAllApiKeys } from '../lib/keychain'
import { runAgentStream } from '../lib/agent-runner'
import { findSkill } from '../lib/skills'
import { ApprovalDialog } from './ApprovalDialog'
import { AiInputBar } from './AiInputBar'
import { AiCssVisualizer } from './AiCssVisualizer'
import { AiChat } from './AiChat'
import { saveToStore } from '../store/chatStore'
import type { AiProviderId } from '../lib/config'

type AiPanelProps = {
  detached?: boolean
}

export function AiPanel({ detached }: AiPanelProps = {}) {
  const {
    sessions,
    activeSessionId,
    provider,
    model,
    apiKeys,
    createSession,
    setActiveSession,
    setProvider,
    setModel,
  } = useChatStore()

  const availableModels = useChatStore((s) => s.availableModels)
  const refreshModels = useChatStore((s) => s.refreshModels)
  const setMode = useAiWindowStore((s) => s.setMode)

  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [keysLoaded, setKeysLoaded] = useState(false)

  useEffect(() => {
    if (!keysLoaded) {
      loadAllApiKeys().then(() => setKeysLoaded(true))
    }
    refreshModels()
  }, [keysLoaded, refreshModels])

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const handleDetach = async () => {
    await saveToStore()
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      const webview = new WebviewWindow('ai-chat', {
        url: '/',
        width: 420,
        height: 600,
        minWidth: 320,
        minHeight: 400,
        title: 'Flame AI',
      })
      webview.once('tauri://created', () => {
        useAiWindowStore.getState().setDetached('ai-chat')
      })
      webview.once('tauri://error', () => {
        setMode('side-panel')
      })
    } catch {
      setMode('side-panel')
    }
  }

  return (
    <div className="flex h-full flex-col bg-background border-l border-border">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="text-sm">🔥</span>
        <span
          className="text-xs font-semibold"
          style={{
            background: 'linear-gradient(90deg, #ff9f45, #6c7cff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Flame AI
        </span>
        <button
          onClick={() => { createSession(); setShowSettings(false) }}
          className="text-[10px] text-muted-foreground hover:text-foreground px-1"
        >
          + New
        </button>
        <div className="ml-auto flex gap-0.5">
          {!detached && (
            <button
              onClick={() => setMode('floating')}
              className="text-[10px] text-muted-foreground hover:text-foreground px-1 rounded"
              title="Switch to popup"
            >
              ⊞
            </button>
          )}
          {!detached && (
            <button
              onClick={handleDetach}
              className="text-[10px] text-muted-foreground hover:text-foreground px-1 rounded"
              title="Detach to separate window"
            >
              ⛶
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-[10px] text-muted-foreground hover:text-foreground px-1 rounded"
          >
            {showSettings ? 'Chat' : 'Settings'}
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-auto">
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
              {(provider === 'opencode-zen' && availableModels.length > 0
                ? availableModels
                : getProvider(provider).models
              ).map((m) => (
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

          {provider === 'openai-compatible' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Base URL</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="http://localhost:1234/v1"
                className="bg-muted text-foreground text-xs rounded px-2 py-1 border border-border"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <AiCssVisualizer />
          {sessions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground px-4 text-center">
              <div className="flex flex-col gap-2">
                <span className="text-xs">No conversations yet</span>
                <button
                  onClick={() => createSession()}
                  className="text-xs bg-primary text-white rounded px-3 py-1"
                >
                  Start new chat
                </button>
              </div>
            </div>
          ) : activeSession ? (
            <>
              <ChatView sessionId={activeSession.id} />
              <ApprovalDialog />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
              Select a session or create a new one
            </div>
          )}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="border-t border-border px-2 py-1 flex gap-1 overflow-x-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className={`text-[10px] px-2 py-0.5 rounded whitespace-nowrap ${
                s.id === activeSessionId
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ChatView({ sessionId }: { sessionId: string }) {
  const session = useChatStore((s) => s.sessions.find((se) => se.id === sessionId))
  const addMessage = useChatStore((s) => s.addMessage)
  const provider = useChatStore((s) => s.provider)
  const model = useChatStore((s) => s.model)
  const apiKeys = useChatStore((s) => s.apiKeys)
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (message: string) => {
    if (!message.trim() || !session) return

    let messageContent = message.trim()
    const skillMatch = findSkill(messageContent)
    if (skillMatch) {
      messageContent = skillMatch.skill.prompt + '\n\n' + skillMatch.args
    }

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: messageContent,
      timestamp: Date.now(),
    }
    addMessage(sessionId, userMsg)
    setIsLoading(true)

    const apiKey = apiKeys[provider]

    if (!apiKey) {
      addMessage(sessionId, {
        id: `msg-${Date.now()}-err`,
        role: 'assistant' as const,
        content: 'Please set your API key in AI Settings (Cmd+I → Settings)',
        timestamp: Date.now(),
      })
      setIsLoading(false)
      return
    }

    try {
      await runAgentStream(
        { provider, model, apiKey },
        session.messages.concat(userMsg).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        sessionId,
        (error) => {
          addMessage(sessionId, {
            id: `msg-${Date.now()}-err`,
            role: 'assistant' as const,
            content: `Error: ${error}`,
            timestamp: Date.now(),
          })
        },
      )
    } catch (e: any) {
      addMessage(sessionId, {
        id: `msg-${Date.now()}-err`,
        role: 'assistant' as const,
        content: `Error: ${e?.message || String(e)}`,
        timestamp: Date.now(),
      })
    }

    setIsLoading(false)
  }

  if (!session) return null

  const isStreaming = useChatStore((s) => s.isStreaming)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <AiChat messages={session.messages} isStreaming={isStreaming} />
      </div>
      <AiInputBar
        onSend={handleSend}
        onStop={() => setIsLoading(false)}
        isStreaming={isLoading}
      />
    </div>
  )
}
