import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { usePtyBridge } from './pty-bridge'
import { parseOsc7 } from './osc-handlers'
import { useTabs } from '../../tabs'

export function useTerminalSession(
  containerRef: React.RefObject<HTMLDivElement | null>,
  cwd?: string,
  tabId?: string,
) {
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const [isReady, setIsReady] = useState(false)
  const bridge = usePtyBridge()

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace',
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    fitRef.current = fitAddon
    term.loadAddon(fitAddon)

    try {
      term.loadAddon(new WebglAddon())
    } catch {}

    termRef.current = term

    if (containerRef.current) {
      term.open(containerRef.current)
      fitAddon.fit()
    }

    term.onData((data) => bridge.write(data))

    term.onResize(({ cols, rows }) => bridge.resize(cols, rows))

    bridge.onData((data) => {
      const dir = parseOsc7(data)
      if (dir && tabId) {
        useTabs.getState().updateTab(tabId, { cwd: dir })
      }
      term.write(data)
    })

    bridge.onExit(() => setIsReady(false))

    const init = async () => {
      const rect = containerRef.current?.getBoundingClientRect()
      const cols = Math.floor((rect?.width || 800) / 9)
      const rows = Math.floor((rect?.height || 600) / 18)
      await bridge.create(cols, rows, cwd)
      setIsReady(true)
    }

    init()

    return () => {
      bridge.close()
      term.dispose()
    }
  }, [])

  useEffect(() => {
    const handleResize = () => fitRef.current?.fit()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const write = useCallback((data: string) => bridge.write(data), [bridge])

  return { isReady, write }
}
