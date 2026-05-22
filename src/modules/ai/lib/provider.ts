import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createXai } from '@ai-sdk/xai'
import type { AiProviderId } from './config'
import { useChatStore } from '../store/chatStore'

export function createProviderInstance(provider: AiProviderId, apiKey: string) {
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey })
    case 'anthropic':
      return createAnthropic({ apiKey })
    case 'google':
      return createGoogleGenerativeAI({ apiKey })
    case 'groq':
      return createGroq({ apiKey })
    case 'xai':
      return createXai({ apiKey })
    case 'cerebras':
      return createOpenAI({ apiKey, baseURL: 'https://api.cerebras.ai/v1' })
    case 'openai-compatible': {
      const baseURL = useChatStore.getState().model
      return createOpenAI({ apiKey: apiKey || 'not-needed', baseURL })
    }
    default:
      return createOpenAI({ apiKey })
  }
}
