import { memo } from 'react'
import { useTabs } from '../tabs'

export const StatusBar = memo(function StatusBar() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <footer className="flex h-7 items-center gap-2 border-t border-border px-3 text-[10px] text-muted-foreground">
      {activeTab?.cwd && (
        <span className="truncate max-w-96" title={activeTab.cwd}>
          {activeTab.cwd}
        </span>
      )}
      <div className="flex-1" />
      <span className="capitalize">{activeTab?.kind || 'no tab'}</span>
    </footer>
  )
})
