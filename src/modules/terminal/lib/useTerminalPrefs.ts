import { create } from 'zustand'
import { useEffect } from 'react'
import { terminalListApps } from './terminal-bridge'
import type { TerminalApp } from './terminal-bridge'

interface TerminalPrefsState {
  availableApps: TerminalApp[]
  selectedAppId: string
  setSelectedApp: (id: string) => void
  loadApps: () => Promise<void>
}

export const useTerminalPrefs = create<TerminalPrefsState>((set) => ({
  availableApps: [],
  selectedAppId: '',
  setSelectedApp: (id) => {
    set({ selectedAppId: id })
    localStorage.setItem('flame-ade:terminal-app', id)
  },
  loadApps: async () => {
    try {
      const apps = await terminalListApps()
      const saved = localStorage.getItem('flame-ade:terminal-app')
      const defaultId = saved && apps.find((a) => a.id === saved) ? saved : apps[0]?.id || ''
      set({ availableApps: apps, selectedAppId: defaultId })
    } catch {
      set({ availableApps: [], selectedAppId: '' })
    }
  },
}))

export function useTerminalPrefsLoader() {
  const loadApps = useTerminalPrefs((s) => s.loadApps)

  useEffect(() => {
    loadApps()
  }, [])
}
