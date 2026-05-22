import { listen, type UnlistenFn } from '@tauri-apps/api/event'
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

let listeners: Array<{
  cb: (data: string) => void
  exitCb: (exitCode?: number) => void
  unlistenData: UnlistenFn | null
  unlistenExit: UnlistenFn | null
}> = []

export function usePtyBridge(): PtyBridge {
  const sessionIdRef = useRef<string | null>(null)

  const create = useCallback(async (cols: number, rows: number, cwd?: string, shell?: string) => {
    const id = await invoke<string>('pty_create', {
      args: { cols, rows, cwd: cwd || null, shell: shell || null },
    })
    sessionIdRef.current = id
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
    await invoke('pty_close', { sessionId: sessionIdRef.current })
    sessionIdRef.current = null
  }, [])

  const onData = useCallback((cb: (data: string) => void) => {
    listeners.push({ cb, exitCb: () => {}, unlistenData: null, unlistenExit: null })
  }, [])

  const onExit = useCallback((cb: (exitCode?: number) => void) => {
    const last = listeners[listeners.length - 1]
    if (last) last.exitCb = cb
  }, [])

  useEffect(() => {
    let unlistenData: UnlistenFn | null = null
    let unlistenExit: UnlistenFn | null = null

    listen('pty-data', (event: any) => {
      const payload = event.payload as { session_id: string; data: string }
      listeners.forEach((l) => l.cb(payload.data))
    }).then((u) => { unlistenData = u })

    listen('pty-exit', (event: any) => {
      const payload = event.payload as { session_id: string; exit_code?: number }
      listeners.forEach((l) => l.exitCb(payload.exit_code))
    }).then((u) => { unlistenExit = u })

    return () => {
      unlistenData?.()
      unlistenExit?.()
      listeners = []
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
