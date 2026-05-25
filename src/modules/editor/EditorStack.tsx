import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { useEffect, useRef } from 'react'
import { getLanguageExtension, buildSharedExtensions } from './lib/extensions'

interface EditorStackProps {
  path: string
  initialContent?: string
  className?: string
}

export function EditorStack({ path, initialContent = '', className }: EditorStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      basicSetup,
      keymap.of([indentWithTab]),
      getLanguageExtension(path),
      ...buildSharedExtensions(),
      EditorView.lineWrapping,
    ]

    const state = EditorState.create({
      doc: initialContent,
      extensions,
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [path])

  return (
    <div className="h-full w-full overflow-hidden border border-[var(--color-border)]/50" style={{ background: 'color-mix(in srgb, var(--color-base) 80%, transparent)' }}>
      <div ref={containerRef} className={`h-full w-full ${className || ''}`} />
    </div>
  )
}
