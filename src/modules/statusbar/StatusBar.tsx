import { memo } from 'react'
import { cn } from '@/lib/utils'
import { useTabs } from '../tabs'
import { AiStatusBarControls, useChatStore } from '@/modules/ai'
import { useFpsCounter } from './useFpsCounter'

export const StatusBar = memo(function StatusBar() {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const model = useChatStore((s) => s.model)
  const fps = useFpsCounter()

  return (
    <footer
      className="flex h-[var(--statusbar-h)] shrink-0 items-center gap-2 px-3 text-[10px] text-[var(--color-text-secondary)] select-none"
      style={{
        background: 'linear-gradient(90deg, rgba(255,106,0,0.12), rgba(108,124,255,0.08))',
        borderTop: '1px solid rgba(255,106,0,0.15)',
      }}
    >
      {/* Left side */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {activeTab?.cwd && (
          <span className="truncate max-w-80 text-[#3b82f6]" title={activeTab.cwd}>
            {activeTab.cwd}
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn(
          'text-[10px] capitalize',
          activeTab?.kind === 'terminal' && 'text-[#22c55e]',
          activeTab?.kind === 'editor' && 'text-[#3b82f6]',
        )}>
          {activeTab?.kind || '-'}
        </span>
        <span className="h-3 w-px bg-[var(--color-border)]" />
        <AiStatusBarControls />
        <span className="tabular-nums text-[10px] text-[var(--color-text-secondary)]/50">{fps}fps</span>
        <span className="h-3 w-px bg-[var(--color-border)]" />
        <span className="flex items-center gap-1 font-medium text-[#ff9f45]">
          <span
            className="inline-block h-1 w-1 rounded-full"
            style={{
              background: isStreaming ? '#ff6a00' : '#22c55e',
              boxShadow: isStreaming ? '0 0 5px #ff6a00' : '0 0 5px #22c55e',
              animation: 'cssPulse 2s infinite',
            }}
          />
          AI {isStreaming ? 'Streaming' : model || 'Ready'}
        </span>
      </div>
    </footer>
  )
})
