import { createContext, useContext, type ReactNode } from 'react'

type ComposerValue = {
  isStreaming: boolean
  messages: any[]
  append: (content: string) => void
  stop: () => void
}

const ComposerCtx = createContext<ComposerValue>({
  isStreaming: false,
  messages: [],
  append: () => {},
  stop: () => {},
})

export function ComposerProvider({ children }: { children: ReactNode }) {
  return <ComposerCtx.Provider value={{ isStreaming: false, messages: [], append: () => {}, stop: () => {} }}>{children}</ComposerCtx.Provider>
}

export function useComposer() {
  return useContext(ComposerCtx)
}
