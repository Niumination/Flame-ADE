import type { FileEntry } from './lib/fs-bridge'
import { getFileIcon } from './lib/icons'

interface FileTreeProps {
  entries: FileEntry[]
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  onSelect: (entry: FileEntry) => void
  selectedPath?: string
  onContextMenu?: (e: React.MouseEvent, entry: FileEntry) => void
  modifiedPaths?: Set<string>
  newPaths?: Set<string>
}

export function FileTree({ entries, expandedDirs, onToggleDir, onSelect, selectedPath, onContextMenu, modifiedPaths, newPaths }: FileTreeProps) {
  return (
    <div className="select-none text-sm">
      {entries.map((entry) => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          expandedDirs={expandedDirs}
          onToggleDir={onToggleDir}
          onSelect={onSelect}
          selectedPath={selectedPath}
          depth={0}
          onContextMenu={onContextMenu}
          modifiedPaths={modifiedPaths}
          newPaths={newPaths}
        />
      ))}
    </div>
  )
}

interface FileTreeNodeProps {
  entry: FileEntry
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  onSelect: (entry: FileEntry) => void
  selectedPath?: string
  depth: number
  onContextMenu?: (e: React.MouseEvent, entry: FileEntry) => void
  modifiedPaths?: Set<string>
  newPaths?: Set<string>
}

function FileTreeNode({ entry, expandedDirs, onToggleDir, onSelect, selectedPath, depth, onContextMenu, modifiedPaths, newPaths }: FileTreeNodeProps) {
  const isExpanded = expandedDirs.has(entry.path)
  const isSelected = selectedPath === entry.path
  const isDirectory = entry.kind === 'directory'
  const isModified = modifiedPaths?.has(entry.path)
  const isNew = newPaths?.has(entry.path)

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? 'bg-muted text-foreground' : 'text-muted-foreground'
        } ${isModified ? 'ft-item modified' : ''} ${isNew ? 'ft-item new-file' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isDirectory) {
            onToggleDir(entry.path)
          } else {
            onSelect(entry)
          }
        }}
        onContextMenu={(e) => onContextMenu?.(e, entry)}
      >
        {isDirectory && (
          <span className="text-[10px] w-3 text-center text-muted-foreground">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="text-xs">{getFileIcon(entry.kind, entry.name)}</span>
        <span className="truncate flex-1">{entry.name}</span>
      </div>
      {isDirectory && isExpanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeNode
              key={child.path}
              entry={child}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
              onSelect={onSelect}
              selectedPath={selectedPath}
              depth={depth + 1}
              onContextMenu={onContextMenu}
              modifiedPaths={modifiedPaths}
              newPaths={newPaths}
            />
          ))}
        </div>
      )}
    </div>
  )
}
