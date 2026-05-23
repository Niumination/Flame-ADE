import { useTabs } from '../tabs'

interface HeaderProps {
  showExplorer?: boolean
  onToggleExplorer?: () => void
  showAi?: boolean
  onToggleAi?: () => void
}

export function Header({ showExplorer, onToggleExplorer, showAi, onToggleAi }: HeaderProps) {
  const tabs = useTabs((s) => s.tabs)
  const activeTabId = useTabs((s) => s.activeTabId)
  const addTab = useTabs((s) => s.addTab)
  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <header className="flex h-10 items-center gap-2 border-b border-border px-4" data-tauri-drag-region>
      <div className="flex items-center gap-2">
        {onToggleExplorer && (
          <button
            onClick={onToggleExplorer}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            title={showExplorer ? 'Hide explorer' : 'Show explorer'}
          >
            {showExplorer ? '📁' : '📂'}
          </button>
        )}
        {onToggleAi && (
          <button
            onClick={onToggleAi}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            title={showAi ? 'Hide AI' : 'Show AI'}
          >
            {showAi ? '🤖' : '💬'}
          </button>
        )}
        <span className="text-sm font-semibold text-foreground">Flame ADE</span>
        {activeTab && (
          <>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs text-muted-foreground">{activeTab.label}</span>
          </>
        )}
      </div>
      <div className="flex-1" />
      <button
        onClick={() => addTab({ kind: 'preview', label: 'Preview', cwd: 'http://localhost:3000' })}
        className="text-[10px] text-muted-foreground hover:text-foreground px-1"
        title="New preview tab"
      >
        🌐
      </button>
      <button
        onClick={() => addTab({ kind: 'git', label: 'Git', cwd: undefined })}
        className="text-[10px] text-muted-foreground hover:text-foreground px-1"
        title="New git tab"
      >
        ⎇
      </button>
      <button
        onClick={() => addTab({ kind: 'settings', label: 'Settings' })}
        className="text-[10px] text-muted-foreground hover:text-foreground px-1"
        title="Settings"
      >
        ⚙
      </button>
      {activeTab?.cwd && (
        <span className="text-[10px] text-muted-foreground truncate max-w-64" title={activeTab.cwd}>
          {activeTab.cwd}
        </span>
      )}
    </header>
  )
}
