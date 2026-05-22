import { useState, useEffect, useRef, useCallback } from 'react'
import { FileTree } from './FileTree'
import { useExplorer } from './lib/useExplorer'
import type { FileEntry } from './lib/fs-bridge'

interface ExplorerPanelProps {
  rootPath: string
  onFileSelect: (path: string) => void
}

export function ExplorerPanel({ rootPath, onFileSelect }: ExplorerPanelProps) {
  const {
    tree,
    loading,
    error,
    expandedDirs,
    refresh,
    toggleDir,
  } = useExplorer(rootPath)

  const [selectedPath, setSelectedPath] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleSelect = useCallback((entry: FileEntry) => {
    setSelectedPath(entry.path)
    onFileSelect(entry.path)
  }, [onFileSelect])

  const handleSearchToggle = useCallback(() => {
    setIsSearching((prev) => !prev)
    if (!isSearching) {
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      setSearchQuery('')
    }
  }, [isSearching])

  const filteredTree = searchQuery
    ? filterTree(tree, searchQuery)
    : tree

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">EXPLORER</span>
        <div className="flex-1" />
        <button
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={handleSearchToggle}
        >
          🔍
        </button>
        <button
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={refresh}
        >
          🔄
        </button>
      </div>
      {isSearching && (
        <div className="px-2 py-1">
          <input
            ref={searchRef}
            className="w-full rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            Loading...
          </div>
        )}
        {error && (
          <div className="px-2 py-1 text-xs text-destructive">{error}</div>
        )}
        {!loading && !error && (
          <FileTree
            entries={filteredTree}
            expandedDirs={expandedDirs}
            onToggleDir={toggleDir}
            onSelect={handleSelect}
            selectedPath={selectedPath}
          />
        )}
      </div>
    </div>
  )
}

function filterTree(entries: FileEntry[], query: string): FileEntry[] {
  const lowerQuery = query.toLowerCase()
  return entries.reduce<FileEntry[]>((acc, entry) => {
    const nameMatch = entry.name.toLowerCase().includes(lowerQuery)
    if (entry.children) {
      const filteredChildren = filterTree(entry.children, query)
      if (nameMatch || filteredChildren.length > 0) {
        acc.push({
          ...entry,
          children: filteredChildren.length > 0 ? filteredChildren : entry.children,
        })
      }
    } else if (nameMatch) {
      acc.push(entry)
    }
    return acc
  }, [])
}
