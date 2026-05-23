import { create } from 'zustand'
import { createProviderInstance } from './provider'
import type { AiProviderId } from './config'
import { getTools } from '../tools/tools'

export interface PendingApproval {
  id: string
  tool: string
  args: Record<string, unknown>
  resolve: (approved: boolean) => void
}

interface ApprovalStore {
  pending: PendingApproval[]
  addPending: (item: PendingApproval) => void
  removePending: (id: string) => void
  approve: (id: string) => void
  reject: (id: string) => void
}

export const useApprovalStore = create<ApprovalStore>((set) => ({
  pending: [],
  addPending: (item) => set((s) => ({ pending: [...s.pending, item] })),
  removePending: (id) =>
    set((s) => ({ pending: s.pending.filter((p) => p.id !== id) })),
  approve: (id) => {
    set((s) => {
      const item = s.pending.find((p) => p.id === id)
      if (item) item.resolve(true)
      return { pending: s.pending.filter((p) => p.id !== id) }
    })
  },
  reject: (id) => {
    set((s) => {
      const item = s.pending.find((p) => p.id === id)
      if (item) item.resolve(false)
      return { pending: s.pending.filter((p) => p.id !== id) }
    })
  },
}))

export type ProviderKeys = Partial<Record<AiProviderId, string>>

export async function buildLanguageModel(
  providerId: AiProviderId,
  keys: ProviderKeys,
  modelId: string,
  _opts?: { lmstudioBaseURL?: string },
): Promise<any> {
  const apiKey = keys[providerId] || ''
  const provider = createProviderInstance(providerId, apiKey)
  return provider(modelId)
}

export function createToolExecutor(onApprovalNeeded: (tool: string, args: Record<string, unknown>) => Promise<boolean>) {
  const tools = getTools()
  const toolMap = new Map(tools.map((t) => [t.name, t]))

  return async (name: string, args: Record<string, unknown>): Promise<string> => {
    const def = toolMap.get(name)
    if (!def) return `Unknown tool: ${name}`

    if (def.needsApproval) {
      const approved = await onApprovalNeeded(name, args)
      if (!approved) return `Operation cancelled: ${name} (requires approval)`
    }

    return def.execute(args)
  }
}
