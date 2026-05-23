import { create } from 'zustand'
import type { AiProviderId } from '../lib/config'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  title: string
  provider: AiProviderId
  model: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

interface ChatStore {
  sessions: ChatSession[]
  activeSessionId: string | null
  provider: AiProviderId
  model: string
  apiKeys: Partial<Record<AiProviderId, string>>
  isStreaming: boolean
  createSession: (provider?: AiProviderId, model?: string) => string
  deleteSession: (id: string) => void
  setActiveSession: (id: string | null) => void
  addMessage: (sessionId: string, message: ChatMessage) => void
  setApiKey: (provider: AiProviderId, key: string) => void
  setProvider: (provider: AiProviderId) => void
  setModel: (model: string) => void
  clearMessages: (sessionId: string) => void
  updateLastMessage: (sessionId: string, content: string) => void
  setStreaming: (streaming: boolean) => void
}

let sessionCounter = 0

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  provider: 'opencode-zen',
  model: 'claude-sonnet-4-5',
  apiKeys: {},
  isStreaming: false,

  createSession: (provider?: AiProviderId, model?: string) => {
    sessionCounter++
    const id = `session-${Date.now()}-${sessionCounter}`
    const session: ChatSession = {
      id,
      title: `Chat ${sessionCounter}`,
      provider: provider || get().provider,
      model: model || get().model,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    set((s) => ({
      sessions: [...s.sessions, session],
      activeSessionId: id,
    }))
    return id
  },

  deleteSession: (id) => {
    set((s) => {
      const filtered = s.sessions.filter((se) => se.id !== id)
      return {
        sessions: filtered,
        activeSessionId:
          s.activeSessionId === id
            ? filtered[filtered.length - 1]?.id || null
            : s.activeSessionId,
      }
    })
  },

  setActiveSession: (id) => set({ activeSessionId: id }),

  addMessage: (sessionId, message) => {
    set((s) => ({
      sessions: s.sessions.map((se) =>
        se.id === sessionId
          ? {
              ...se,
              messages: [...se.messages, message],
              updatedAt: Date.now(),
            }
          : se
      ),
    }))
  },

  setApiKey: (provider, key) => {
    set((s) => ({
      apiKeys: { ...s.apiKeys, [provider]: key },
    }))
  },

  setProvider: (provider) => set({ provider }),
  setModel: (model) => set({ model }),

  clearMessages: (sessionId) => {
    set((s) => ({
      sessions: s.sessions.map((se) =>
        se.id === sessionId ? { ...se, messages: [], updatedAt: Date.now() } : se
      ),
    }))
  },

  updateLastMessage: (sessionId, content) => {
    set((s) => ({
      sessions: s.sessions.map((se) =>
        se.id === sessionId && se.messages.length > 0
          ? {
              ...se,
              messages: se.messages.map((msg, i) =>
                i === se.messages.length - 1 ? { ...msg, content } : msg
              ),
              updatedAt: Date.now(),
            }
          : se
      ),
    }))
  },

  setStreaming: (streaming) => set({ isStreaming: streaming }),
}))
