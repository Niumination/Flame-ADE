import type { Extension } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { rust } from '@codemirror/lang-rust'
import { python } from '@codemirror/lang-python'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'

export function getLanguageExtension(filename: string): Extension {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return javascript({ typescript: true, jsx: true })
    case 'js':
    case 'jsx':
      return javascript({ jsx: true })
    case 'rs':
      return rust()
    case 'py':
      return python()
    case 'json':
      return json()
    case 'md':
      return markdown()
    case 'css':
      return css()
    case 'html':
    case 'htm':
      return html()
    default:
      return javascript()
  }
}

export function getTheme(_theme: string): Extension {
  return oneDark
}
