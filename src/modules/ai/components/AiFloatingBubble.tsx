import { useCallback } from 'react'
import { useAiWindowStore } from '../store/aiWindowStore'
import { isTauri } from '@tauri-apps/api/core'

export function AiFloatingBubble() {
  const mode = useAiWindowStore((s) => s.mode)
  const setMode = useAiWindowStore((s) => s.setMode)
  const detachedWindowId = useAiWindowStore((s) => s.detachedWindowId)

  const handleClick = useCallback(async () => {
    if (mode === 'detached' && detachedWindowId && isTauri()) {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      const win = await WebviewWindow.getByLabel(detachedWindowId)
      if (win) {
        await win.setFocus()
        return
      }
    }
    setMode('floating')
  }, [mode, detachedWindowId, setMode])

  const isDetached = mode === 'detached'

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a00] to-[#6c7cff] shadow-lg shadow-[#ff6a00]/30 transition-transform duration-200 hover:scale-110 active:scale-95"
      style={{ width: 40, height: 40 }}
      title={isDetached ? 'AI is in a separate window — click to focus' : 'Open AI chat'}
    >
      <span className="relative flex items-center justify-center text-sm">🔥</span>
      {isDetached && (
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e] animate-pulse" />
      )}
    </button>
  )
}
