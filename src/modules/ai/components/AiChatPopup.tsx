import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore, saveToStore, loadFromStore } from '../store/chatStore'
import { useAiWindowStore } from '../store/aiWindowStore'
import { AiCssVisualizer } from './AiCssVisualizer'
import { AiChat } from './AiChat'
import { ApprovalDialog } from './ApprovalDialog'
import { findSkill } from '../lib/skills'
import { runAgentStream } from '../lib/agent-runner'

const SLASH_COMMANDS = ['/explain', '/fix', '/test', '/refactor', '/docs']

export function AiChatPopup() {
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const provider = useChatStore((s) => s.provider)
  const model = useChatStore((s) => s.model)
  const addMessage = useChatStore((s) => s.addMessage)
  const createSession = useChatStore((s) => s.createSession)
  const apiKeys = useChatStore((s) => s.apiKeys)
  const setMode = useAiWindowStore((s) => s.setMode)
  const popupRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, left: 0, top: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0 })

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  useEffect(() => {
    loadFromStore().then(() => {
      const state = useChatStore.getState()
      if (!state.activeSessionId && state.sessions.length === 0) {
        state.createSession()
      }
    })
  }, [])

  const getSessionId = useCallback(() => {
    return activeSessionId || createSession()
  }, [activeSessionId, createSession])

  const handleSend = useCallback(async (message: string) => {
    if (!message.trim()) return
    const sid = getSessionId()

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
    addMessage(sid, userMsg)

    const session = useChatStore.getState().sessions.find((s) => s.id === sid)
    if (!session) return

    const apiKey = apiKeys[provider]
    if (!apiKey) {
      addMessage(sid, {
        id: `msg-${Date.now()}-err`,
        role: 'assistant' as const,
        content: 'Please set your API key in AI Settings',
        timestamp: Date.now(),
      })
      return
    }

    try {
      await runAgentStream(
        { provider, model, apiKey },
        session.messages.concat(userMsg).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        sid,
        (error) => {
          addMessage(sid, {
            id: `msg-${Date.now()}-err`,
            role: 'assistant' as const,
            content: `Error: ${error}`,
            timestamp: Date.now(),
          })
        },
      )
    } catch (e: any) {
      addMessage(sid, {
        id: `msg-${Date.now()}-err`,
        role: 'assistant' as const,
        content: `Error: ${e?.message || String(e)}`,
        timestamp: Date.now(),
      })
    }
  }, [addMessage, provider, model, apiKeys, getSessionId])

  const handleDetach = useCallback(async () => {
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
        setMode('floating')
      })
    } catch {
      setMode('floating')
    }
  }, [setMode])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target.closest('[data-drag-handle]')) return
    dragRef.current.isDragging = true
    dragRef.current.startX = e.clientX - pos.x
    dragRef.current.startY = e.clientY - pos.y
  }, [pos])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return
      setPos({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY })
    }
    const handleMouseUp = () => {
      dragRef.current.isDragging = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleSlashClick = useCallback((cmd: string) => {
    handleSend(cmd)
  }, [handleSend])

  const isStreaming = useChatStore((s) => s.isStreaming)

  return (
    <>
      <div
        ref={popupRef}
        onMouseDown={handleMouseDown}
        className="fixed z-40 flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/60"
        style={{
          width: 380,
          maxHeight: 520,
          bottom: 24,
          right: typeof pos.x === 'number' && pos.x !== 0 ? 'auto' : 16,
          left: pos.x !== 0 ? pos.x + 16 : undefined,
          top: pos.y !== 0 ? pos.y + 24 : undefined,
        }}
      >
        {/* Header */}
        <div
          data-drag-handle
          className="flex cursor-grab items-center gap-2 border-b border-white/[0.07] px-3 py-2.5 select-none"
        >
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

          <div className="ml-auto flex items-center gap-1">
            <div
              className="flex cursor-pointer items-center gap-1 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)] transition-colors hover:border-[rgba(255,106,0,0.3)] hover:text-[#ff9f45]"
              style={{ background: 'var(--color-raised)' }}
              title="Current model"
            >
              {model || 'GPT-4o mini'} ▾
            </div>

            <button
              onClick={() => setMode('side-panel')}
              className="rounded px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-overlay)] hover:text-[var(--color-text-primary)]"
              title="Expand to side panel"
            >
              ⊞
            </button>

            <button
              onClick={handleDetach}
              className="rounded px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-overlay)] hover:text-[var(--color-text-primary)]"
              title="Detach to separate window"
            >
              ⛶
            </button>

            <button
              onClick={() => setMode('hidden')}
              className="ml-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-overlay)] hover:text-[var(--color-text-primary)]"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Visualizer */}
        <AiCssVisualizer compact />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-overlay) transparent' }}>
          <AiChat
            messages={activeSession?.messages || []}
            isStreaming={isStreaming}
            className="p-3"
          />
        </div>

        {/* Slash commands */}
        <div className="flex flex-shrink-0 flex-wrap gap-1 border-t border-b border-[var(--color-border)] px-3 py-1.5">
          {SLASH_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleSlashClick(cmd)}
              className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-secondary)] transition-colors hover:border-[rgba(255,106,0,0.4)] hover:bg-[rgba(255,106,0,0.08)] hover:text-[#ff9f45]"
              style={{ background: 'var(--color-raised)' }}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-2.5">
          <div
            className="overflow-hidden rounded-lg transition-all duration-150 input-focus-ring"
            style={{ background: 'var(--color-raised)', border: '1px solid var(--color-border)' }}
          >
            <textarea
              className="w-full resize-none bg-transparent px-2.5 py-2 text-xs text-[var(--color-text-primary)] outline-none placeholder-[var(--color-text-muted)]"
              placeholder="Tanya Flame AI… (/ untuk slash commands)"
              rows={2}
              onFocus={() => {
                const el = document.querySelector('.input-focus-ring') as HTMLElement
                if (el) { el.style.borderColor = 'rgba(255,106,0,0.4)'; el.style.boxShadow = '0 0 0 2px rgba(255,106,0,0.08)' }
              }}
              onBlur={() => {
                const el = document.querySelector('.input-focus-ring') as HTMLElement
                if (el) { el.style.borderColor = 'var(--color-border)'; el.style.boxShadow = 'none' }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  const ta = e.currentTarget
                  handleSend(ta.value)
                  ta.value = ''
                }
              }}
            />
            <div className="flex items-center gap-1 border-t border-white/[0.07] px-2 py-1">
              <button className="rounded p-0.5 text-xs text-[#8890a8] transition-colors hover:text-[#e8eaf0]" title="Attach file">📎</button>
              <button className="rounded p-0.5 text-xs text-[#8890a8] transition-colors hover:text-[#e8eaf0]" title="Voice input">🎤</button>
              <button className="rounded p-0.5 text-xs text-[#8890a8] transition-colors hover:text-[#e8eaf0]" title="Context">@</button>
              <button
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-xs text-white shadow-sm transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #ff6a00, #6c7cff)',
                  boxShadow: '0 2px 8px rgba(255,106,0,0.3)',
                }}
                title="Send (⌘↵)"
                onClick={(e) => {
                  const container = e.currentTarget.closest('[class*="flex-shrink-0"]')
                  const ta = container?.querySelector('textarea')
                  if (ta) { handleSend(ta.value); ta.value = '' }
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>

      <ApprovalDialog />
    </>
  )
}
