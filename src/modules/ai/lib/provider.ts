import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createXai } from '@ai-sdk/xai'
import type { AiProviderId } from './config'
import { AI_PROVIDERS } from './config'
import { useChatStore } from '../store/chatStore'
import { corsFetch } from './cors-fetch'

const corsOpts = { fetch: corsFetch }

export function createProviderInstance(provider: AiProviderId, apiKey: string) {
  const config = AI_PROVIDERS.find((p) => p.id === provider)

  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey, ...corsOpts })
    case 'anthropic':
      return createAnthropic({ apiKey })
    case 'google':
      return createGoogleGenerativeAI({ apiKey })
    case 'groq':
      return createGroq({ apiKey })
    case 'xai':
      return createXai({ apiKey })
    case 'cerebras':
      return createOpenAI({ apiKey, baseURL: 'https://api.cerebras.ai/v1', ...corsOpts })
    case 'opencode-zen':
      return createOpenAI({ apiKey, baseURL: 'https://opencode.ai/zen/v1', ...corsOpts })
    case 'openai-compatible': {
      const baseURL = useChatStore.getState().model
      return createOpenAI({ apiKey: apiKey || 'not-needed', baseURL, ...corsOpts })
    }
    default:
      if (config?.baseUrl) {
        return createOpenAI({ apiKey, baseURL: config.baseUrl, ...corsOpts })
      }
      return createOpenAI({ apiKey, ...corsOpts })
  }
}

export function resolveLanguageModel(providerInstance: unknown, modelId: string) {
  const p = providerInstance as Record<string, unknown>
  if (typeof p.chat === 'function') {
    return (p.chat as (id: string) => unknown)(modelId)
  }
  return (p.languageModel as (id: string) => unknown)(modelId)
}
