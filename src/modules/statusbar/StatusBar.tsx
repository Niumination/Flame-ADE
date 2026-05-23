import { memo } from 'react'
import { useTabs } from '../tabs'
import { cn } from '@/lib/utils'
import { AiStatusBarControls } from '@/modules/ai'

export const StatusBar = memo(function StatusBar() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-border/60 bg-card/60 px-3 text-[11px] text-muted-foreground">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {activeTab?.cwd && (
          <span className="truncate max-w-96" title={activeTab.cwd}>
            {activeTab.cwd}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <AiStatusBarControls />
        <span>{tabs.length} tab{tabs.length !== 1 ? '' : ''}</span>
        <span className={cn(
          'capitalize',
          activeTab?.kind === 'terminal' && 'text-green-500',
          activeTab?.kind === 'editor' && 'text-blue-500',
        )}>
          {activeTab?.kind || 'tidak ada tab'}
        </span>
      </div>
    </footer>
  )
})
