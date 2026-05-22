export type AiProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'groq'
  | 'xai'
  | 'cerebras'
  | 'openai-compatible'

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
]

export function getProvider(id: AiProviderId): AiProviderConfig {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0]
}
