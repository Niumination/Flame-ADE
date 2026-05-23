import { create } from 'zustand'

export type TabKind = 'terminal' | 'editor' | 'preview' | 'ai-diff' | 'git' | 'settings' | 'markdown' | 'git-history'

export interface MarkdownTab extends Tab {
  kind: 'markdown'
  path: string
}

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

const TAB_ICONS: Record<TabKind, string> = {
  terminal: '⬛',
  editor: '📝',
  preview: '🌐',
  'ai-diff': '📊',
  git: '⎇',
  settings: '⚙',
  markdown: '📄',
  'git-history': '🌳',
}

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

  removeTab: (id) => {
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return state
      const tabs = state.tabs.filter((t) => t.id !== id)
      let activeTabId = state.activeTabId
      if (activeTabId === id) {
        if (tabs.length === 0) activeTabId = ''
        else if (idx >= tabs.length) activeTabId = tabs[tabs.length - 1].id
        else activeTabId = tabs[idx].id
      }
      return { tabs, activeTabId }
    })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  moveTab: (fromIndex, toIndex) => {
    set((state) => {
      const tabs = [...state.tabs]
      const [moved] = tabs.splice(fromIndex, 1)
      tabs.splice(toIndex, 0, moved)
      return { tabs }
    })
  },

  duplicateTab: (id) => {
    const tab = get().tabs.find((t) => t.id === id)
    if (!tab) return
    get().addTab({ kind: tab.kind, label: `${tab.label} (copy)`, cwd: tab.cwd })
  },

  closeOtherTabs: (id) => {
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id)
      if (!tab) return state
      return { tabs: [tab], activeTabId: id }
    })
  },

  closeTabsToRight: (id) => {
    set((state) => {
      const idx = state.tabs.findIndex((t) => t.id === id)
      if (idx === -1) return state
      const tabs = state.tabs.slice(0, idx + 1)
      return {
        tabs,
        activeTabId: state.tabs.find((t) => t.id === state.activeTabId) ? state.activeTabId : id,
      }
    })
  },

  getTabIcon: (kind) => TAB_ICONS[kind] || '⬜',
}))
