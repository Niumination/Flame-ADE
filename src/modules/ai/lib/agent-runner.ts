import { streamText, tool as aiTool } from 'ai'
import { createProviderInstance } from './provider'
import { getTools } from '../tools/tools'
import { useApprovalStore } from './agent'
import { useChatStore } from '../store/chatStore'
import type { AiProviderId } from './config'

export interface AgentConfig {
  provider: AiProviderId
  model: string
  apiKey: string
}

const BASE_SYSTEM_PROMPT = `You are Flame ADE, an AI coding assistant with access to file system and shell tools.

Rules:
- Read files before editing them
- Use search/grep to find relevant code before writing
- Get user approval before writing files, running commands, or destructive operations
- Clean up after yourself
- Be concise and helpful`

export async function runAgentStream(
  config: AgentConfig,
  messages: { role: 'user' | 'assistant'; content: string }[],
  sessionId: string,
  onError: (error: string) => void,
): Promise<void> {
  const provider = createProviderInstance(config.provider, config.apiKey)
  const tools = getTools()
  const store = useChatStore

  const coreTools: Record<string, unknown> = {}
  for (const t of tools) {
    coreTools[t.name] = aiTool({
      description: t.description,
      parameters: t.parameters,
      execute: async (args: any) => {
        if (t.needsApproval) {
          const approved = await new Promise<boolean>((resolve) => {
            useApprovalStore.getState().addPending({
              id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              tool: t.name,
              args,
              resolve,
            })
          })
          if (!approved) {
            return `Operation cancelled: ${t.name} requires user approval.`
          }
        }
        return t.execute(args as Record<string, unknown>)
      },
    } as any)
  }

  store.getState().setStreaming(true)

  try {
    const msgId = `msg-${Date.now()}-stream`
    store.getState().addMessage(sessionId, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    })

    const result = streamText({
      model: provider(config.model),
      system: BASE_SYSTEM_PROMPT,
      messages,
      tools: coreTools,
    } as any)

    let fullText = ''
    for await (const chunk of result.textStream) {
      fullText += chunk
      store.getState().updateLastMessage(sessionId, fullText)
    }
  } catch (e: any) {
    const msg = e?.message || String(e)
    onError(msg)
  } finally {
    store.getState().setStreaming(false)
  }
}
