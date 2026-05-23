import { createProviderInstance } from './provider'
import type { AiProviderId } from './config'

export interface TransportConfig {
  provider: AiProviderId
  model: string
  apiKey?: string
}

export function createTransport(config: TransportConfig) {
  return createProviderInstance(config.provider, config.model)
}
