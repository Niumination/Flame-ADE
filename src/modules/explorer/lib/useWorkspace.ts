import { create } from 'zustand'
import { open } from '@tauri-apps/plugin-dialog'
import { readTree } from './fs-bridge'
import type { FileEntry } from './fs-bridge'

interface WorkspaceState {
  workspacePath: string | null
  recentWorkspaces: string[]
  tree: FileEntry[]
  loading: boolean
  error: string | null
  setWorkspace: (path: string) => Promise<void>
  clearWorkspace: () => void
  refresh: () => Promise<void>
  pickAndSetWorkspace: () => Promise<void>
}

const STORAGE_KEY = 'flame-ade:recent-workspaces'

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecent(paths: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(paths))
}

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  workspacePath: null,
  recentWorkspaces: loadRecent(),
  tree: [],
  loading: false,
  error: null,

  setWorkspace: async (path: string) => {
    set({ workspacePath: path, loading: true, error: null })
    try {
      const data = await readTree(path)
      const recents = loadRecent()
      const updated = [path, ...recents.filter((r) => r !== path)].slice(0, 10)
      saveRecent(updated)
      set({ tree: data, loading: false, recentWorkspaces: updated })
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
        loading: false,
      })
    }
  },

  clearWorkspace: () => {
    set({ workspacePath: null, tree: [], error: null })
  },

  refresh: async () => {
    const { workspacePath } = get()
    if (!workspacePath) return
    set({ loading: true, error: null })
    try {
      const data = await readTree(workspacePath)
      set({ tree: data, loading: false })
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
        loading: false,
      })
    }
  },

  pickAndSetWorkspace: async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Open Folder' })
      if (selected && typeof selected === 'string') {
        await get().setWorkspace(selected)
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
      })
    }
  },
}))
