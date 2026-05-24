import { useState, useRef, useEffect, useCallback } from 'react'
import { FileTree } from './FileTree'
import { useWorkspace } from './lib/useWorkspace'
import type { FileEntry } from './lib/fs-bridge'

// Re-export workspace store for convenience
export { useWorkspace } from './lib/useWorkspace'

interface ExplorerPanelProps {
  onFileSelect: (path: string) => void
}

export function ExplorerPanel({ onFileSelect }: ExplorerPanelProps) {
  const {
    workspacePath,
    recentWorkspaces,
    tree,
    loading,
    error,
    setWorkspace,
    refresh,
    pickAndSetWorkspace,
    createItem,
    renameItem,
    deleteItem,
  } = useWorkspace()
  const [selectedPath, setSelectedPath] = useState<string>()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [contextMenuTarget, setContextMenuTarget] = useState<FileEntry | null>(null)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameRef = useRef<HTMLInputElement>(null)
  const [creatingIn, setCreatingIn] = useState<{ parent: string; kind: 'file' | 'directory' } | null>(null)
  const [createName, setCreateName] = useState('')
  const createRef = useRef<HTMLInputElement>(null)

  const handleSelect = useCallback((entry: FileEntry) => {
    setSelectedPath(entry.path)
    onFileSelect(entry.path)
  }, [onFileSelect])

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleSearchToggle = useCallback(() => {
    setIsSearching((prev) => !prev)
    if (!isSearching) {
      setTimeout(() => searchRef.current?.focus(), 0)
    } else {
      setSearchQuery('')
    }
  }, [isSearching])

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault()
    setContextMenuPos({ x: e.clientX, y: e.clientY })
    setContextMenuTarget(entry)
  }, [])

  useEffect(() => {
    if (contextMenuTarget) {
      const handler = (e: MouseEvent) => {
        if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
          setContextMenuTarget(null)
        }
      }
      setTimeout(() => document.addEventListener('mousedown', handler), 0)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [contextMenuTarget])

  useEffect(() => {
    if (renamingPath) renameRef.current?.focus()
  }, [renamingPath])

  useEffect(() => {
    if (creatingIn) createRef.current?.focus()
  }, [creatingIn])

  const handleRenameStart = useCallback((entry: FileEntry) => {
    setRenamingPath(entry.path)
    setRenameValue(entry.name)
    setContextMenuTarget(null)
  }, [])

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingPath || !renameValue.trim()) return
    const parent = renamingPath.split('/').slice(0, -1).join('/')
    await renameItem(renamingPath, parent + '/' + renameValue.trim())
    setRenamingPath(null)
    setRenameValue('')
  }, [renamingPath, renameValue, renameItem])

  const handleCreateSubmit = useCallback(async () => {
    if (!creatingIn || !createName.trim()) return
    await createItem(creatingIn.parent, createName.trim(), creatingIn.kind)
    setCreatingIn(null)
    setCreateName('')
  }, [creatingIn, createName, createItem])

  const filteredTree = searchQuery
    ? tree.filter((e) => filterEntry(e, searchQuery))
    : tree

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">EXPLORER</span>
        <div className="flex-1" />
        <button
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={pickAndSetWorkspace}
          title="Open Folder"
        >
          <span className="text-xs">📂</span>
        </button>
        {workspacePath && (
          <>
            <button
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={handleSearchToggle}
              title="Search"
            >
              <span className="text-xs">🔍</span>
            </button>
            <button
              className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={refresh}
              title="Refresh"
            >
              <span className="text-xs">🔄</span>
            </button>
          </>
        )}
      </div>

      {isSearching && workspacePath && (
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
        {!workspacePath && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
            <div className="text-3xl opacity-50">📂</div>
            <div className="text-sm text-foreground font-medium">No folder opened</div>
            <div className="text-xs text-muted-foreground max-w-[180px]">
              Open a folder to browse its contents in the explorer
            </div>
            <button
              onClick={pickAndSetWorkspace}
              className="text-xs bg-primary text-primary-foreground rounded px-4 py-1.5 hover:opacity-90"
            >
              Open Folder
            </button>
            {recentWorkspaces.length > 0 && (
              <div className="w-full mt-2">
                <div className="text-[10px] text-muted-foreground mb-1 text-left">Recent</div>
                {recentWorkspaces.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWorkspace(w)}
                    className="w-full text-left text-xs text-foreground/70 hover:text-foreground truncate py-0.5 px-1 rounded hover:bg-muted/50"
                  >
                    {w.split('/').pop() || w}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {workspacePath && loading && (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            Loading...
          </div>
        )}

        {workspacePath && error && (
          <div className="px-2 py-1 text-xs text-destructive">
            {error}
            <button onClick={refresh} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {workspacePath && !loading && !error && (
          <>
            {creatingIn && (
              <div className="px-2 py-1">
                <input
                  ref={createRef}
                  className="w-full rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={creatingIn.kind === 'file' ? 'filename.txt' : 'folder-name'}
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSubmit()
                    if (e.key === 'Escape') { setCreatingIn(null); setCreateName('') }
                  }}
                />
              </div>
            )}
            <FileTree
              entries={filteredTree}
              expandedDirs={expandedDirs}
              onToggleDir={toggleDir}
              onSelect={handleSelect}
              selectedPath={selectedPath}
              onContextMenu={handleContextMenu}
            />
            {renamingPath && (
              <div className="px-2 py-1">
                <input
                  ref={renameRef}
                  className="w-full rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit()
                    if (e.key === 'Escape') { setRenamingPath(null); setRenameValue('') }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {contextMenuTarget && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[140px] rounded-md border border-border bg-popover py-1 shadow-lg"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          {contextMenuTarget.kind === 'directory' && (
            <>
              <button
                className="w-full px-3 py-1 text-left text-xs text-popover-foreground hover:bg-muted/50"
                onClick={() => { setCreatingIn({ parent: contextMenuTarget.path, kind: 'file' }); setContextMenuTarget(null) }}
              >New File</button>
              <button
                className="w-full px-3 py-1 text-left text-xs text-popover-foreground hover:bg-muted/50"
                onClick={() => { setCreatingIn({ parent: contextMenuTarget.path, kind: 'directory' }); setContextMenuTarget(null) }}
              >New Folder</button>
              <div className="border-t border-border my-1" />
            </>
          )}
          <button
            className="w-full px-3 py-1 text-left text-xs text-popover-foreground hover:bg-muted/50"
            onClick={() => handleRenameStart(contextMenuTarget)}
          >Rename</button>
          <button
            className="w-full px-3 py-1 text-left text-xs text-destructive hover:bg-destructive/10"
            onClick={async () => { await deleteItem(contextMenuTarget.path); setContextMenuTarget(null) }}
          >Delete</button>
        </div>
      )}
    </div>
  )
}

function filterEntry(entry: FileEntry, query: string): boolean {
  const lowerQuery = query.toLowerCase()
  const nameMatch = entry.name.toLowerCase().includes(lowerQuery)
  if (entry.children) {
    return nameMatch || entry.children.some((c) => filterEntry(c, query))
  }
  return nameMatch
}
