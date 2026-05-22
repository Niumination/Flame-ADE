import { create } from 'zustand'

export type TabKind = 'terminal' | 'editor' | 'preview' | 'ai-diff' | 'git'

export interface Tab {
  id: string
  kind: TabKind
  label: string
  cwd?: string
  sessionId?: string
  icon?: string
}

interface TabsState {
  tabs: Tab[]
  activeTabId: string
  addTab: (tab: Omit<Tab, 'id'>) => string
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  moveTab: (fromIndex: number, toIndex: number) => void
  duplicateTab: (id: string) => void
  closeOtherTabs: (id: string) => void
  closeTabsToRight: (id: string) => void
  getTabIcon: (kind: TabKind) => string
}

let nextId = 1

export const useTabs = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: '',

  addTab: (tab) => {
    const id = `tab-${nextId++}`
    const icon = get().getTabIcon(tab.kind)
    const newTab = { ...tab, id, icon }
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: id,
    }))
    return id
  },

  removeTab: (id) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      const newTabs = state.tabs.filter((t) => t.id !== id)
      let activeTabId = state.activeTabId
      if (state.activeTabId === id) {
        if (newTabs.length === 0) {
          activeTabId = ''
        } else {
          const newIdx = Math.min(idx, newTabs.length - 1)
          activeTabId = newTabs[newIdx].id
        }
      }
      return { tabs: newTabs, activeTabId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  moveTab: (fromIndex, toIndex) =>
    set((state) => {
      const newTabs = [...state.tabs]
      const [moved] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, moved)
      return { tabs: newTabs }
    }),

  duplicateTab: (id) => {
    const tab = get().tabs.find((t) => t.id === id)
    if (tab) {
      get().addTab({
        kind: tab.kind,
        label: `${tab.label} (copy)`,
        cwd: tab.cwd,
      })
    }
  },

  closeOtherTabs: (id) =>
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id === id),
      activeTabId: id,
    })),

  closeTabsToRight: (id) =>
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      return {
        tabs: state.tabs.slice(0, idx + 1),
        activeTabId: state.activeTabId === id ? id : state.activeTabId,
      }
    }),

  getTabIcon: (kind) => {
    switch (kind) {
      case 'terminal':
        return '>_'
      case 'editor':
        return '</>'
      case 'preview':
        return '🌐'
      case 'ai-diff':
        return '✨'
      case 'git':
        return '⎇'
      default:
        return '📄'
    }
  },
}))
