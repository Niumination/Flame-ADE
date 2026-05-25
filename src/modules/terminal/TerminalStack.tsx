import { useRef } from 'react'
import { useTerminalSession } from './lib/useTerminalSession'
import { useTabs } from '../tabs'

interface TerminalStackProps {
  tabId?: string
  cwd?: string
}

export function TerminalStack({ cwd, tabId }: TerminalStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isReady } = useTerminalSession(containerRef, cwd, tabId)
  const addTab = useTabs((s) => s.addTab)

  return (
    <div className="relative h-full w-full overflow-hidden border border-[var(--color-border)]/60 backdrop-blur-sm" style={{ background: 'color-mix(in srgb, var(--color-base) 80%, transparent)' }}>
      {/* Terminal Header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)]/60 px-3 py-1.5 select-none" style={{ background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)' }}>
        <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">Terminal</span>
        <span className="text-[9px] text-[var(--color-text-muted)]">zsh</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-[9px] text-[var(--color-text-muted)]">
          <span className="cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors" title="Split"
            onClick={() => addTab({ kind: 'terminal', label: `Terminal` })}
          >⊞ Split</span>
          <span className="mx-1">·</span>
          <span className="cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors" title="New terminal"
            onClick={() => addTab({ kind: 'terminal', label: `Terminal` })}
          >+ New</span>
        </div>
        {cwd && (
          <span className="text-[9px] text-[#3b82f6] truncate max-w-40" title={cwd}>
            ~/{cwd.split('/').pop() || cwd}
          </span>
        )}
      </div>
      {/* Terminal Body */}
      <div ref={containerRef} className="absolute inset-0" style={{ top: '30px' }} />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" style={{ top: '30px' }}>
          <span className="text-sm">Starting terminal...</span>
        </div>
      )}
    </div>
  )
}
