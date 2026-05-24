import { streamText, tool as aiTool, jsonSchema } from 'ai'
import { createProviderInstance, resolveLanguageModel } from './provider'
import { getTools } from '../tools/tools'
import { useApprovalStore } from './agent'
import { useChatStore } from '../store/chatStore'
import type { AiProviderId } from './config'

export interface AgentConfig {
  provider: AiProviderId
  model: string
  apiKey: string
}

const STREAM_TIMEOUT_MS = 120_000
const APPROVAL_TIMEOUT_MS = 30_000
const TOOL_TIMEOUT_MS = 60_000

const BASE_SYSTEM_PROMPT = `You are Flame ADE, an AI coding assistant with access to file system and shell tools.

Rules:
- Read files before editing them
- Use search/grep to find relevant code before writing
- Get user approval before writing files, running commands, or destructive operations
- Clean up after yourself
- Be concise and helpful`

function delay(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
  )
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, delay(ms)]) as Promise<T>
}

async function requestApproval(_toolName: string, args: Record<string, unknown>): Promise<boolean> {
  return withTimeout(
    new Promise<boolean>((resolve) => {
      useApprovalStore.getState().addPending({
        id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tool: _toolName,
        args,
        resolve,
      })
    }),
    APPROVAL_TIMEOUT_MS,
  ).catch(() => false)
}

export async function runAgentStream(
  config: AgentConfig,
  messages: { role: 'user' | 'assistant'; content: string }[],
  sessionId: string,
  onError: (error: string) => void,
): Promise<void> {
  const provider = createProviderInstance(config.provider, config.apiKey)
  const tools = getTools()
  const store = useChatStore
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS)

  const coreTools: Record<string, unknown> = {}
  for (const t of tools) {
    coreTools[t.name] = aiTool({
      description: t.description,
      inputSchema: jsonSchema(t.parameters),
      execute: async (args: any) => {
        if (t.needsApproval) {
          const approved = await requestApproval(t.name, args as Record<string, unknown>)
          if (!approved) {
            return `Operation cancelled: ${t.name} requires user approval.`
          }
        }
        return withTimeout(
          Promise.resolve(t.execute(args as Record<string, unknown>)),
          TOOL_TIMEOUT_MS,
        )
      },
    } as any)
  }

  store.getState().setStreaming(true)

  let fullText = ''

  try {
    const msgId = `msg-${Date.now()}-stream`
    store.getState().addMessage(sessionId, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    })

    const result = streamText({
      model: resolveLanguageModel(provider, config.model),
      system: BASE_SYSTEM_PROMPT,
      messages,
      tools: coreTools,
      abortSignal: controller.signal,
    } as any)

    for await (const chunk of result.textStream) {
      fullText += chunk
      store.getState().updateLastMessage(sessionId, fullText)
    }
  } catch (e: any) {
    console.error('[AgentRunner] stream error:', e)
    if (e?.name === 'AbortError') {
      onError('Request timed out. Coba kirim ulang pesan atau periksa koneksi.')
    } else {
      const msg = e?.message || String(e)
      onError(msg)
    }
  } finally {
    clearTimeout(timeout)
    store.getState().setStreaming(false)
    const finalState = controller.signal.aborted ? 'aborted' : 'completed'
    console.log(`[AgentRunner] stream finished — state: ${finalState}, fullText length: ${fullText?.length || 0}`)
  }
}
