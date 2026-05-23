export type ModelPreferences = {
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

export const DEFAULT_MODEL_PREFS: ModelPreferences = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
}
