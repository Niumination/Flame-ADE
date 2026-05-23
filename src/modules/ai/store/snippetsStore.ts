import { create } from 'zustand'
import type { Snippet } from '../lib/snippets'

interface SnippetsStore {
  snippets: Snippet[]
  addSnippet: (snippet: Snippet) => void
  removeSnippet: (id: string) => void
}

export const useSnippetsStore = create<SnippetsStore>((set) => ({
  snippets: [],
  addSnippet: (snippet) => set((s) => ({ snippets: [...s.snippets, snippet] })),
  removeSnippet: (id) => set((s) => ({ snippets: s.snippets.filter((sn) => sn.id !== id) })),
}))
