export interface KeyBinding {
  key: string
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  handler: () => void
}

const keyBindings: KeyBinding[] = []

export function registerShortcut(binding: KeyBinding): () => void {
  keyBindings.push(binding)
  return () => {
    const idx = keyBindings.indexOf(binding)
    if (idx >= 0) keyBindings.splice(idx, 1)
  }
}

export function getBindings(): KeyBinding[] {
  return [...keyBindings]
}

export function matchBinding(e: KeyboardEvent): KeyBinding | undefined {
  return keyBindings.find((b) => {
    if (b.key.toLowerCase() !== e.key.toLowerCase()) return false
    if (b.meta && !e.metaKey) return false
    if (b.ctrl && !e.ctrlKey) return false
    if (b.shift && !e.shiftKey) return false
    if (b.alt && !e.altKey) return false
    return true
  })
}
