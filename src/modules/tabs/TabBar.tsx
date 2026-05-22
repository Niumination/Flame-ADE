import { useState, useRef, useEffect, memo } from 'react'
import { useTabs, type Tab } from './useTabs'
import { cn } from '@/lib/utils'

function TabItem({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const { setActiveTab, removeTab, closeOtherTabs, closeTabsToRight, duplicateTab } = useTabs()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  return (
    <div className="relative">
      <div
        className={cn(
          'group flex items-center gap-1.5 rounded-t-md border-t border-x border-border px-3 py-1.5 text-xs cursor-pointer select-none transition-colors',
          isActive
            ? 'bg-muted text-foreground border-b-transparent'
            : 'bg-background text-muted-foreground hover:text-foreground',
        )}
        onClick={() => setActiveTab(tab.id)}
        onContextMenu={(e) => {
          e.preventDefault()
          setShowMenu(true)
        }}
        title={tab.cwd || tab.label}
      >
        <span className="text-[10px] opacity-70">{tab.icon}</span>
        <span className="truncate max-w-28">{tab.label}</span>
        <button
          className="ml-0.5 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity text-xs"
          onClick={(e) => {
            e.stopPropagation()
            removeTab(tab.id)
          }}
        >
          ×
        </button>
      </div>
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 z-50 mt-0.5 w-40 rounded-md border border-border bg-popover shadow-lg"
        >
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-popover-foreground hover:bg-muted/50"
            onClick={() => { duplicateTab(tab.id); setShowMenu(false) }}
          >
            Duplicate
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-popover-foreground hover:bg-muted/50"
            onClick={() => { closeOtherTabs(tab.id); setShowMenu(false) }}
          >
            Close Others
          </button>
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-popover-foreground hover:bg-muted/50"
            onClick={() => { closeTabsToRight(tab.id); setShowMenu(false) }}
          >
            Close to Right
          </button>
          <div className="border-t border-border" />
          <button
            className="w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
            onClick={() => { removeTab(tab.id); setShowMenu(false) }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

export const TabBar = memo(function TabBar() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const addTab = useTabs((s) => s.addTab)

  return (
    <div className="flex items-end gap-0.5 px-2 pt-1 overflow-x-auto">
      {tabs.map((tab) => (
        <TabItem key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
      ))}
      <button
        className="ml-1 rounded px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
        onClick={() =>
          addTab({
            kind: 'terminal',
            label: `Terminal ${tabs.filter((t) => t.kind === 'terminal').length + 1}`,
          })
        }
      >
        +
      </button>
    </div>
  )
})
