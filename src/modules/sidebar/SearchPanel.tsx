import { useState, useRef, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { SearchCodeIcon } from '@hugeicons/core-free-icons'

interface SearchPanelProps {
  onFileSelect: (path: string) => void
}

export function SearchPanel({ onFileSelect: _onFileSelect }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <HugeiconsIcon icon={SearchCodeIcon} size={14} className="text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files..."
          className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[10px] text-muted-foreground/40">
          {query ? 'No results' : 'Type to search files'}
        </p>
      </div>
    </div>
  )
}
