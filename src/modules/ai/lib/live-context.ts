import { useTabs } from '../../tabs'

export interface LiveContext {
  getCwd: () => string | undefined
  getTerminalOutput: () => string
  setLive: (ctx: LiveContext) => void
}

let liveContext: LiveContext | null = null

export function setLive(ctx: LiveContext) {
  liveContext = ctx
}

export function getLive(): LiveContext | null {
  return liveContext
}

export function useLiveContext() {
  const activeTabId = useTabs((s) => s.activeTabId)
  const tabs = useTabs((s) => s.tabs)
  const activeTab = tabs.find((t) => t.id === activeTabId)

  return {
    cwd: activeTab?.cwd,
    tabKind: activeTab?.kind,
  }
}
