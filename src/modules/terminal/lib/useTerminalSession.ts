import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { usePtyBridge } from './pty-bridge'
import { parseOsc7, parseOsc133 } from './osc-handlers'
import { useTabs } from '../../tabs'
import { themes } from './themes'

export interface TerminalSession {
  terminal: Terminal
  sessionId: string | null
  isReady: boolean
}

export function useTerminalSession(
  containerRef: React.RefObject<HTMLDivElement | null>,
  theme: string = 'default',
  cwd?: string,
  tabId?: string,
): TerminalSession {
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const bridge = usePtyBridge()

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace',
      theme: themes[theme] || themes.default,
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    fitAddonRef.current = fitAddon
    term.loadAddon(fitAddon)

    try {
      const webglAddon = new WebglAddon()
      term.loadAddon(webglAddon)
    } catch {
      // WebGL not available, fallback to canvas
    }

    terminalRef.current = term

    if (containerRef.current) {
      term.open(containerRef.current)
      fitAddon.fit()
    }

    term.onData((data) => {
      bridge.write(data)
    })

    term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      bridge.resize(cols, rows)
    })

    bridge.onData((data) => {
      const dir = parseOsc7(data)
      if (dir && tabId) {
        useTabs.getState().updateTab(tabId, { cwd: dir })
      }
      parseOsc133(data)
      term.write(data)
    })

    bridge.onExit(() => {
      setIsReady(false)
    })

    const init = async () => {
      const rect = containerRef.current?.getBoundingClientRect()
      const cols = Math.floor((rect?.width || 800) / 8)
      const rows = Math.floor((rect?.height || 600) / 16)
      const id = await bridge.create(cols, rows, cwd)
      setSessionId(id)
      setIsReady(true)
    }

    init()

    return () => {
      bridge.close()
      term.dispose()
    }
  }, [])

  useEffect(() => {
    if (terminalRef.current && themes[theme]) {
      terminalRef.current.options.theme = themes[theme]
    }
  }, [theme])

  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { terminal: terminalRef.current!, sessionId, isReady }
}
