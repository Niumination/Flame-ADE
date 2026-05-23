import { invoke } from '@tauri-apps/api/core'
import { useChatStore } from '../store/chatStore'
import type { AiProviderId } from './config'

const SERVICE = 'flame-ade'

function accountFor(provider: AiProviderId): string {
  return `api-key:${provider}`
}

export async function loadApiKey(provider: AiProviderId): Promise<string | null> {
  try {
    const result = await invoke<string | null>('secrets_get', {
      service: SERVICE,
      account: accountFor(provider),
    })
    return result
  } catch {
    return null
  }
}

export async function saveApiKey(provider: AiProviderId, key: string): Promise<void> {
  try {
    await invoke('secrets_set', {
      service: SERVICE,
      account: accountFor(provider),
      password: key,
    })
    useChatStore.getState().setApiKey(provider, key)
  } catch (e) {
    console.error('Failed to save API key:', e)
  }
}

export async function deleteApiKey(provider: AiProviderId): Promise<void> {
  try {
    await invoke('secrets_delete', {
      service: SERVICE,
      account: accountFor(provider),
    })
    useChatStore.getState().setApiKey(provider, '')
  } catch (e) {
    console.error('Failed to delete API key:', e)
  }
}

export async function loadAllApiKeys(): Promise<void> {
  const providers: AiProviderId[] = [
    'opencode-zen',
    'openai',
    'anthropic',
    'google',
    'groq',
    'xai',
    'cerebras',
  ]
  for (const provider of providers) {
    const key = await loadApiKey(provider)
    if (key) {
      useChatStore.getState().setApiKey(provider, key)
    }
  }
}
