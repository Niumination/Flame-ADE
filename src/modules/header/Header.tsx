import { useTabs } from '../tabs'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Settings01Icon } from '@hugeicons/core-free-icons'
import { IS_MAC } from '@/lib/platform'
import { useChatStore } from '@/modules/ai'
import { FlameLogo } from '@/components/ui/FlameLogo'

interface HeaderProps {
  showExplorer?: boolean
  onToggleExplorer?: () => void
  showAi?: boolean
  onToggleAi?: () => void
}

export function Header({ showExplorer, onToggleExplorer, showAi, onToggleAi }: HeaderProps) {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const model = useChatStore((s) => s.model)
  const isStreaming = useChatStore((s) => s.isStreaming)

  return (
    <header
      className={`flex h-[var(--header-h)] items-center gap-2 border-b border-[var(--color-border)] bg-sidebar select-none ${IS_MAC ? 'pl-20 pr-2' : 'px-2'}`}
      data-tauri-drag-region
    >
      {/* Brand */}
      <div className="flex items-center gap-1.5 shrink-0">
        <FlameLogo size={5} />
        <span
          className="text-sm font-semibold italic"
          style={{ background: 'linear-gradient(90deg, #ff9f45, #6c7cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Flame ADE
        </span>
      </div>

      <span className="mx-1.5 h-4 w-px shrink-0 bg-[var(--color-border)]" />

      {/* Workspace tabs (htabs) — show current tab kinds as quick actions */}
      <nav className="flex items-center gap-0.5 flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const dotMap: Record<string, string> = { terminal: '#22c55e', editor: '#3b82f6', git: '#f59e0b', preview: '#4338ca' }
          return (
            <button
              key={tab.id}
              onClick={() => useTabs.getState().setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition-colors whitespace-nowrap ${
                isActive ? 'bg-[var(--color-hover)]/30 text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]/20'
              }`}
            >
              <span className="inline-block size-[6px] rounded-full shrink-0" style={{ background: dotMap[tab.kind] || 'var(--color-text-muted)' }} />
              {tab.label}
              <span className="text-[9px] ml-0.5 text-[var(--color-text-muted)]">✕</span>
            </button>
          )
        })}
        <button
          onClick={() => useTabs.getState().addTab({ kind: 'terminal', label: `Terminal ${tabs.filter((t) => t.kind === 'terminal').length + 1}` })}
          className="flex items-center justify-center size-5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]/20 text-sm"
          title="New tab"
        >
          +
        </button>
      </nav>

      <div className="flex items-center gap-1 shrink-0">
        {/* Explorer Toggle */}
        {onToggleExplorer && (
          <Button variant="ghost" size="icon-sm"
            onClick={onToggleExplorer}
            className="shrink-0 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]/20"
            title={showExplorer ? 'Hide sidebar' : 'Show sidebar'}
          >
            <span className="text-xs">{showExplorer ? '📁' : '📂'}</span>
          </Button>
        )}

        {/* AI Model Pill */}
        <div
          className="flex cursor-pointer items-center gap-1.5 rounded border border-[var(--color-border)] px-2 py-1 text-[10px] text-[var(--color-text-secondary)] transition-colors hover:border-[rgba(255,106,0,0.3)] hover:text-[#ff9f45] shrink-0"
          style={{ background: 'var(--color-raised)' }}
          onClick={onToggleAi}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              background: isStreaming ? '#ff6a00' : '#3ddc84',
              boxShadow: isStreaming ? '0 0 6px #ff6a00' : '0 0 6px #3ddc84',
              animation: 'cssPulse 2s infinite',
            }}
          />
          {model || 'GPT-4o mini'}
        </div>

        {/* AI Chat Toggle */}
        {onToggleAi && (
          <button
            onClick={onToggleAi}
            className="flex items-center gap-1 rounded border px-2 py-1 text-[11px] shrink-0 transition-all"
            style={{
              background: showAi
                ? 'linear-gradient(135deg, rgba(255,106,0,0.15), rgba(108,124,255,0.15))'
                : 'transparent',
              borderColor: showAi ? 'rgba(255,106,0,0.3)' : 'var(--color-border)',
              color: showAi ? '#ff9f45' : 'var(--color-text-secondary)',
            }}
            title={showAi ? 'Hide AI' : 'Show AI'}
          >
            ⚡ AI Chat
          </button>
        )}

        {/* Settings */}
        <Button variant="ghost" size="icon-sm"
          onClick={() => useTabs.getState().addTab({ kind: 'settings', label: 'Settings' })}
          className="shrink-0 rounded text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]/20"
          title="Settings"
        >
          <HugeiconsIcon icon={Settings01Icon} size={15} strokeWidth={1.75} />
        </Button>
      </div>
    </header>
  )
}
