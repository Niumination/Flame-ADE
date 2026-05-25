import { create } from 'zustand'

export type AiMode = 'hidden' | 'floating' | 'side-panel' | 'detached'

interface AiWindowStore {
  mode: AiMode
  detachedWindowId: string | null
  setMode: (mode: AiMode) => void
  toggleFloating: () => void
  setDetached: (id: string) => void
  clearDetached: () => void
}

export const useAiWindowStore = create<AiWindowStore>((set, get) => ({
  mode: 'hidden',
  detachedWindowId: null,

  setMode: (mode) => set({ mode }),

  toggleFloating: () => {
    const { mode } = get()
    if (mode === 'hidden') set({ mode: 'floating' })
    else if (mode === 'floating') set({ mode: 'side-panel' })
    else set({ mode: 'floating' })
  },

  setDetached: (id) => set({ mode: 'detached', detachedWindowId: id }),

  clearDetached: () => set({ mode: 'hidden', detachedWindowId: null }),
}))
