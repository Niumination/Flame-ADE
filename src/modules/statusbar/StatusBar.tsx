import { memo } from 'react'
import { useTabs } from '../tabs'
import { cn } from '@/lib/utils'
import { AiStatusBarControls, useChatStore } from '@/modules/ai'
import { useFpsCounter } from './useFpsCounter'

export const StatusBar = memo(function StatusBar() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const fps = useFpsCounter()

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
        <span className="flex items-center gap-1">
          <span className={cn('inline-block size-1.5 rounded-full', isStreaming ? 'bg-indigo-500 animate-pulse' : 'bg-green-500')} />
          <span className="text-[10px]">{isStreaming ? 'AI Streaming' : 'AI Ready'}</span>
        </span>
        <AiStatusBarControls />
        <span className="tabular-nums text-[10px] text-muted-foreground/50">{fps}fps</span>
        <span>{tabs.length} tab</span>
        <span className={cn(
          'capitalize',
          activeTab?.kind === 'terminal' && 'text-green-500',
          activeTab?.kind === 'editor' && 'text-blue-500',
        )}>
          {activeTab?.kind || '-'}
        </span>
      </div>
    </footer>
  )
})
