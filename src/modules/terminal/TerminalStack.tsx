import { useEffect, useState } from 'react'
import { terminalOpen } from './lib/terminal-bridge'
import { useTerminalPrefs } from './lib/useTerminalPrefs'
import { useWorkspace } from '../explorer/lib/useWorkspace'

interface TerminalStackProps {
  tabId?: string
  cwd?: string
}

export function TerminalStack({ cwd }: TerminalStackProps) {
  const [state, setState] = useState<'opening' | 'open' | 'error'>('opening')
  const [errorMsg, setErrorMsg] = useState('')
  const selectedAppId = useTerminalPrefs((s) => s.selectedAppId)
  const availableApps = useTerminalPrefs((s) => s.availableApps)
  const workspacePath = useWorkspace((s) => s.workspacePath)

  const appName = availableApps.find((a) => a.id === selectedAppId)?.name || 'Terminal'
  const targetDir = cwd || workspacePath || ''

  useEffect(() => {
    if (!selectedAppId) return
    setState('opening')
    terminalOpen(targetDir, selectedAppId)
      .then(() => setState('open'))
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setState('error')
      })
  }, [selectedAppId, targetDir])

  const handleRetry = () => {
    setState('opening')
    terminalOpen(targetDir, selectedAppId)
      .then(() => setState('open'))
      .catch((err) => {
        setErrorMsg(err instanceof Error ? err.message : String(err))
        setState('error')
      })
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      {state === 'opening' && (
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span className="text-sm">Opening {appName}...</span>
        </div>
      )}
      {state === 'open' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">
            {appName === 'Terminal.app' ? '💻' :
             appName === 'kitty' ? '🐱' : '▢'}
          </div>
          <div className="text-sm text-foreground font-medium">{appName}</div>
          <div className="text-xs text-muted-foreground max-w-xs truncate">{targetDir}</div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleRetry}
              className="text-xs bg-muted text-foreground rounded px-3 py-1.5 hover:bg-muted/80 border border-border"
            >
              Reopen
            </button>
          </div>
        </div>
      )}
      {state === 'error' && (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-sm text-destructive">Failed to open terminal</span>
          <span className="text-xs text-muted-foreground max-w-sm">{errorMsg}</span>
          <button
            onClick={handleRetry}
            className="text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
