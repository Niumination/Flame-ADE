import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useEffect, useRef, useCallback } from 'react'

export interface PtyBridge {
  sessionId: string | null
  create: (cols: number, rows: number, cwd?: string, shell?: string) => Promise<string>
  write: (data: string) => Promise<void>
  resize: (cols: number, rows: number) => Promise<void>
  close: () => Promise<void>
  onData: (cb: (data: string) => void) => void
  onExit: (cb: (exitCode?: number) => void) => void
}

const dataCallbacks = new Map<string, (data: string) => void>()
const exitCallbacks = new Map<string, (exitCode?: number) => void>()

let listenersReady: Promise<void> | null = null
let listenerFailCount = 0
const MAX_LISTENER_RETRIES = 3

async function ensureListeners(): Promise<void> {
  if (listenersReady) {
    try {
      await listenersReady
      return
    } catch {
      // previous attempt failed, will retry below
    }
  }
  listenersReady = (async () => {
    await Promise.all([
      listen('pty-data', (event: any) => {
        const payload = event.payload as { session_id: string; data: string }
        dataCallbacks.get(payload.session_id)?.(payload.data)
      }),
      listen('pty-exit', (event: any) => {
        const payload = event.payload as { session_id: string; exit_code?: number }
        exitCallbacks.get(payload.session_id)?.(payload.exit_code)
      }),
    ])
  })()
  try {
    await listenersReady
    listenerFailCount = 0
  } catch (err) {
    listenerFailCount++
    listenersReady = null
    if (listenerFailCount <= MAX_LISTENER_RETRIES) {
      return ensureListeners()
    }
    throw err
  }
}

export function usePtyBridge(): PtyBridge {
  const sessionIdRef = useRef<string | null>(null)
  const dataCbRef = useRef<((data: string) => void) | null>(null)
  const exitCbRef = useRef<((exitCode?: number) => void) | null>(null)

  useEffect(() => {
    ensureListeners().catch(() => {})
    return () => {
      if (sessionIdRef.current) {
        dataCallbacks.delete(sessionIdRef.current)
        exitCallbacks.delete(sessionIdRef.current)
      }
    }
  }, [])

  const create = useCallback(async (cols: number, rows: number, cwd?: string, shell?: string) => {
    await ensureListeners()
    const id = await invoke<string>('pty_create', {
      args: { cols, rows, cwd: cwd || null, shell: shell || null },
    })
    sessionIdRef.current = id
    if (dataCbRef.current) dataCallbacks.set(id, dataCbRef.current)
    if (exitCbRef.current) exitCallbacks.set(id, exitCbRef.current)
    return id
  }, [])

  const write = useCallback(async (data: string) => {
    if (!sessionIdRef.current) return
    await invoke('pty_write', { sessionId: sessionIdRef.current, data })
  }, [])

  const resize = useCallback(async (cols: number, rows: number) => {
    if (!sessionIdRef.current) return
    await invoke('pty_resize', { sessionId: sessionIdRef.current, cols, rows })
  }, [])

  const close = useCallback(async () => {
    if (!sessionIdRef.current) return
    dataCallbacks.delete(sessionIdRef.current)
    exitCallbacks.delete(sessionIdRef.current)
    await invoke('pty_close', { sessionId: sessionIdRef.current })
    sessionIdRef.current = null
  }, [])

  const onData = useCallback((cb: (data: string) => void) => {
    dataCbRef.current = cb
    if (sessionIdRef.current) {
      dataCallbacks.set(sessionIdRef.current, cb)
    }
  }, [])

  const onExit = useCallback((cb: (exitCode?: number) => void) => {
    exitCbRef.current = cb
    if (sessionIdRef.current) {
      exitCallbacks.set(sessionIdRef.current, cb)
    }
  }, [])

  return {
    sessionId: sessionIdRef.current,
    create,
    write,
    resize,
    close,
    onData,
    onExit,
  }
}
