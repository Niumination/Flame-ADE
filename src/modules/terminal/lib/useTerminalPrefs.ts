import { create } from 'zustand'

interface TerminalApp {
  id: string
  name: string
  path: string
}

interface TerminalPrefsState {
  fontSize: number
  setFontSize: (size: number) => void
  cursorStyle: 'block' | 'underline' | 'bar'
  setCursorStyle: (style: 'block' | 'underline' | 'bar') => void
  cursorBlink: boolean
  setCursorBlink: (blink: boolean) => void
  availableApps: TerminalApp[]
  selectedAppId: string | null
  setSelectedApp: (id: string) => void
  loadApps: () => Promise<void>
}

export const useTerminalPrefs = create<TerminalPrefsState>((set) => ({
  fontSize: 14,
  setFontSize: (fontSize) => set({ fontSize }),
  cursorStyle: 'block',
  setCursorStyle: (cursorStyle) => set({ cursorStyle }),
  cursorBlink: true,
  setCursorBlink: (cursorBlink) => set({ cursorBlink }),
  availableApps: [],
  selectedAppId: null,
  setSelectedApp: (id) => set({ selectedAppId: id }),
  loadApps: async () => {
    set({ availableApps: [], selectedAppId: null })
  },
}))
