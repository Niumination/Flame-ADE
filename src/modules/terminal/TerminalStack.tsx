import { useRef } from 'react'
import { useTerminalSession } from './lib/useTerminalSession'

interface TerminalStackProps {
  tabId?: string
  cwd?: string
}

export function TerminalStack({ cwd, tabId }: TerminalStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isReady } = useTerminalSession(containerRef, cwd, tabId)

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background text-muted-foreground">
          <span className="text-sm">Starting terminal...</span>
        </div>
      )}
    </div>
  )
}
