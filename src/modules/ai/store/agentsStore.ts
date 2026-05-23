import { create } from 'zustand'

export interface AgentDef {
  id: string
  label: string
  description: string
  model?: string
}

interface AgentsStore {
  agents: AgentDef[]
  activeAgentId: string | null
  setActiveAgent: (id: string) => void
}

export const useAgentsStore = create<AgentsStore>((set) => ({
  agents: [
    { id: 'auto', label: 'Auto', description: 'Automatic agent selection' },
    { id: 'plan', label: 'Plan', description: 'Plan mode' },
    { id: 'code', label: 'Code', description: 'Code-focused agent' },
  ],
  activeAgentId: 'auto',
  setActiveAgent: (id) => set({ activeAgentId: id }),
}))
