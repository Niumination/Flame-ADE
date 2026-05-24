import { useTabs } from '../tabs'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { CodeIcon, GitBranchIcon, Settings01Icon, TerminalIcon } from '@hugeicons/core-free-icons'
import { IS_MAC } from '@/lib/platform'
import { AgentSwitcher } from '@/modules/ai'
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
  const addTab = useTabs((s) => s.addTab)
  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <header
      className={`flex h-10 items-center gap-2 border-b border-border/60 bg-card select-none ${IS_MAC ? 'pl-20 pr-2' : 'px-2'}`}
      data-tauri-drag-region
    >
      <div className="flex items-center gap-1 shrink-0">
        {onToggleExplorer && (
          <Button variant="ghost" size="icon-sm"
            onClick={onToggleExplorer}
            className="shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title={showExplorer ? 'Sembunyikan explorer' : 'Tampilkan explorer'}
          >
            <HugeiconsIcon icon={CodeIcon} size={16} strokeWidth={1.75} />
          </Button>
        )}
        {onToggleAi && (
          <Button variant="ghost" size="icon-sm"
            onClick={onToggleAi}
            className="shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title={showAi ? 'Sembunyikan AI' : 'Tampilkan AI'}
          >
            <span className="text-sm">{showAi ? '🤖' : '💬'}</span>
          </Button>
        )}
      </div>

      <AgentSwitcher className="shrink-0" />

      <span className="mx-1 h-5 w-px shrink-0 bg-border" />

      <div className="flex min-w-0 flex-1 items-center gap-2" data-tauri-drag-region>
        <FlameLogo size={5} />
        <span className="text-sm font-semibold italic text-foreground shrink-0">Flame <span className="text-indigo-500">ADE</span></span>
        {activeTab && (
          <>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs text-muted-foreground truncate">{activeTab.label}</span>
          </>
        )}
        <div data-tauri-drag-region className="h-full min-w-2 flex-1" />
      </div>

      <Button variant="ghost" size="icon-sm"
        onClick={() => addTab({ kind: 'terminal', label: `Terminal ${tabs.filter((t) => t.kind === 'terminal').length + 1}` })}
        className="shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Terminal baru"
      >
        <HugeiconsIcon icon={TerminalIcon} size={15} strokeWidth={1.75} />
      </Button>
      <Button variant="ghost" size="icon-sm"
        onClick={() => addTab({ kind: 'preview', label: 'Preview', cwd: 'http://localhost:3000' })}
        className="shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Preview baru"
      >
        <span className="text-sm">🌐</span>
      </Button>
      <Button variant="ghost" size="icon-sm"
        onClick={() => addTab({ kind: 'git', label: 'Git', cwd: undefined })}
        className="shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Git panel"
      >
        <HugeiconsIcon icon={GitBranchIcon} size={15} strokeWidth={1.75} />
      </Button>
      <Button variant="ghost" size="icon-sm"
        onClick={() => addTab({ kind: 'settings', label: 'Pengaturan' })}
        className="shrink-0 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Pengaturan"
      >
        <HugeiconsIcon icon={Settings01Icon} size={15} strokeWidth={1.75} />
      </Button>

      {activeTab?.cwd && (
        <span className="text-[10px] text-muted-foreground truncate max-w-64 hidden sm:block" title={activeTab.cwd}>
          {activeTab.cwd}
        </span>
      )}
    </header>
  )
}
