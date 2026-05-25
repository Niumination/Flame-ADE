import { useState, useRef, useEffect, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useTabs, type Tab } from './useTabs'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AddCircleIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

function TabItem({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const { setActiveTab, removeTab, closeOtherTabs, closeTabsToRight, duplicateTab } = useTabs()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const tabRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (isActive && tabRef.current) {
      tabRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
    }
  }, [isActive])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    setDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', tab.id)
  }, [tab.id])

  const handleDragEnd = useCallback(() => {
    setDragging(false)
  }, [])

  return (
    <div className="relative">
      <div
        ref={tabRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          'group flex items-center gap-1.5 rounded-t-md border-t border-x border-border px-3 py-1.5 text-xs cursor-pointer select-none transition-colors',
          isActive
            ? 'bg-muted text-foreground border-b-transparent'
            : 'bg-background text-muted-foreground hover:text-foreground',
          dragging && 'opacity-50',
        )}
        onClick={() => setActiveTab(tab.id)}
        onContextMenu={(e) => { e.preventDefault(); setShowMenu(true) }}
        title={tab.cwd || tab.label}
      >
        <span className={`tab-dot ${tab.kind}`} />
        <span className="truncate max-w-28">{tab.label}</span>
        <button
          className="ml-0.5 rounded p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity text-xs"
          onClick={(e) => { e.stopPropagation(); removeTab(tab.id) }}
          data-testid="close-tab"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={10} strokeWidth={2} />
        </button>
      </div>
      {showMenu && (
        <div ref={menuRef}
          className="absolute top-full left-0 z-50 mt-0.5 w-40 rounded-md border border-border bg-popover shadow-lg"
        >
          <button className="w-full px-3 py-1.5 text-left text-xs text-popover-foreground hover:bg-muted/50"
            onClick={() => { duplicateTab(tab.id); setShowMenu(false) }}
          >Duplikat</button>
          <button className="w-full px-3 py-1.5 text-left text-xs text-popover-foreground hover:bg-muted/50"
            onClick={() => { closeOtherTabs(tab.id); setShowMenu(false) }}
          >Tutup Lainnya</button>
          <button className="w-full px-3 py-1.5 text-left text-xs text-popover-foreground hover:bg-muted/50"
            onClick={() => { closeTabsToRight(tab.id); setShowMenu(false) }}
          >Tutup ke Kanan</button>
          <div className="border-t border-border" />
          <button className="w-full px-3 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
            onClick={() => { removeTab(tab.id); setShowMenu(false) }}
          >Tutup</button>
        </div>
      )}
    </div>
  )
}

export const TabBar = memo(function TabBar() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const addTab = useTabs((s) => s.addTab)
  const moveTab = useTabs((s) => s.moveTab)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    const sourceIndex = tabs.findIndex((t) => t.id === sourceId)
    if (sourceIndex === -1 || sourceIndex === targetIndex) return
    moveTab(sourceIndex, targetIndex)
  }, [tabs, moveTab])

  return (
    <div className="flex items-end gap-0.5 px-2 pt-1 overflow-x-auto"
      onDragOver={handleDragOver}
    >
      <AnimatePresence mode="popLayout">
        {tabs.map((tab, i) => (
          <motion.div
            key={tab.id}
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onDrop={(e) => handleDrop(e, i)}
          >
            <TabItem tab={tab} isActive={tab.id === activeTabId} />
          </motion.div>
        ))}
      </AnimatePresence>
      <Button
        variant="ghost"
        size="sm"
        className="ml-1 rounded h-7 px-2 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
        onClick={() =>
          addTab({
            kind: 'terminal',
            label: `Terminal ${tabs.filter((t) => t.kind === 'terminal').length + 1}`,
          })
        }
        data-testid="add-tab"
        title="Terminal baru"
      >
        <HugeiconsIcon icon={AddCircleIcon} size={14} strokeWidth={1.75} />
      </Button>
    </div>
  )
})
