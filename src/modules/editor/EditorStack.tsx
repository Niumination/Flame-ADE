import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { getLanguageExtension, getTheme } from './lib/extensions'

interface EditorStackProps {
  path: string
  initialContent?: string
  theme?: string
  className?: string
}

export function EditorStack({ path, initialContent = '', theme = 'dark', className }: EditorStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      basicSetup,
      keymap.of([indentWithTab]),
      getLanguageExtension(path),
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { overflow: 'auto' },
      }),
      EditorView.lineWrapping,
    ]

    if (theme === 'dark') {
      extensions.push(getTheme(theme))
    }

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
  }, [path, theme])

  return (
    <div ref={containerRef} className={`h-full w-full overflow-hidden ${className || ''}`} />
  )
}
