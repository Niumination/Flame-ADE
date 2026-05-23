import { useRef } from 'react'
import { useTerminalSession } from './lib/useTerminalSession'

interface TerminalStackProps {
  theme?: string
  cwd?: string
  tabId?: string
  className?: string
}

export function TerminalStack({ theme = 'default', cwd, tabId, className }: TerminalStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isReady } = useTerminalSession(containerRef, theme, cwd, tabId)

  return (
    <div className={`relative h-full w-full ${className || ''}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background text-muted-foreground">
          <span className="text-sm">Starting terminal...</span>
        </div>
      )}
    </div>
  )
}
