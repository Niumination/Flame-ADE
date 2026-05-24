import { invoke } from '@tauri-apps/api/core'

export type AiProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'xai'
  | 'cerebras'
  | 'openai-compatible'
  | 'opencode-zen'

export const OPENCODE_ZEN_BASE = 'https://opencode.ai/zen/v1'

export interface AiProviderConfig {
  id: AiProviderId
  name: string
  models: string[]
  needsApiKey: boolean
  defaultModel: string
  baseUrl?: string
}

export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
    needsApiKey: true,
    defaultModel: 'gpt-4o',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-3-20250307'],
    needsApiKey: true,
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    id: 'google',
    name: 'Google',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    needsApiKey: true,
    defaultModel: 'gemini-2.5-flash',
  },
  {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'deepseek-r1-distill-llama-70b'],
    needsApiKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
  },
  {
    id: 'xai',
    name: 'xAI',
    models: ['grok-2-1212'],
    needsApiKey: true,
    defaultModel: 'grok-2-1212',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    models: ['llama-3.3-70b'],
    needsApiKey: true,
    defaultModel: 'llama-3.3-70b',
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    models: ['custom'],
    needsApiKey: false,
    defaultModel: 'custom',
    baseUrl: 'http://localhost:1234/v1',
  },
  {
    id: 'opencode-zen',
    name: 'OpenCode Zen',
    models: [
      'nemotron-3-super-free',
      'deepseek-v4-flash-free',
      'big-pickle',
      'claude-sonnet-4-5',
      'claude-haiku-4-5',
      'gpt-5.2-codex',
      'gpt-5.2',
      'gpt-5.1-codex',
      'gemini-3-pro',
      'gemini-3-flash',
    ],
    needsApiKey: true,
    defaultModel: 'nemotron-3-super-free',
    baseUrl: OPENCODE_ZEN_BASE,
  },
]

export async function fetchOpenCodeZenModels(): Promise<string[]> {
  try {
    const result = await invoke<{ status: number; headers: Record<string, string>; body: number[] }>(
      'ai_http_request',
      {
        url: `${OPENCODE_ZEN_BASE}/models`,
        method: 'GET',
        headers: {},
        body: null,
        allowPrivateNetwork: false,
      },
    )
    const text = new TextDecoder().decode(new Uint8Array(result.body))
    const data = JSON.parse(text)
    if (data?.data && Array.isArray(data.data)) {
      return data.data.map((m: { id: string }) => m.id)
    }
  } catch (e) {
    console.error('[config] Failed to fetch OpenCode Zen models:', e)
  }
  return []
}

export function getProvider(id: AiProviderId): AiProviderConfig {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[AI_PROVIDERS.length - 1]
}

export type ModelId = string

export const DEFAULT_MODEL_ID: ModelId = 'claude-sonnet-4-5'

export function getModel(modelId: ModelId): { provider: AiProviderId; id: string } {
  for (const provider of AI_PROVIDERS) {
    if (provider.models.includes(modelId)) {
      return { provider: provider.id, id: modelId }
    }
  }
  return { provider: AI_PROVIDERS[0].id, id: modelId }
}
