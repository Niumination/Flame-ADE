import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { AI_PROVIDERS, getProvider } from '../lib/config'
import { saveApiKey, loadAllApiKeys } from '../lib/keychain'
import { runAgentStream } from '../lib/agent-runner'
import { findSkill } from '../lib/skills'
import { ApprovalDialog } from './ApprovalDialog'
import { VoiceInput } from './VoiceInput'
import type { AiProviderId } from '../lib/config'

export function AiPanel() {
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

  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [keysLoaded, setKeysLoaded] = useState(false)

  useEffect(() => {
    if (!keysLoaded) {
      loadAllApiKeys().then(() => setKeysLoaded(true))
    }
  }, [keysLoaded])

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="flex h-full flex-col bg-background border-l border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-foreground">AI</span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              createSession()
              setShowSettings(false)
            }}
            className="text-xs text-muted-foreground hover:text-foreground px-1"
          >
            + New
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-muted-foreground hover:text-foreground px-1"
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
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  const handleSend = async () => {
    if (!input.trim() || !session) return

    let messageContent = input.trim()
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
    setInput('')
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto px-3 py-2 space-y-2">
        {session.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg px-3 py-1.5 text-xs">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-2 flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type /explain, /fix, /test..."
          className="flex-1 bg-muted text-foreground text-xs rounded px-2 py-1.5 border border-border outline-none"
        />
        <VoiceInput onTranscript={(text) => setInput((p) => p + text)} disabled={isLoading} />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-primary text-white text-xs rounded px-3 py-1.5 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
