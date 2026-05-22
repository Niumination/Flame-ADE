import type { FileEntry } from './lib/fs-bridge'
import { getFileIcon } from './lib/icons'

interface FileTreeProps {
  entries: FileEntry[]
  expandedDirs: Set<string>
  onToggleDir: (path: string) => void
  onSelect: (entry: FileEntry) => void
  selectedPath?: string
}

export function FileTree({ entries, expandedDirs, onToggleDir, onSelect, selectedPath }: FileTreeProps) {
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
}

function FileTreeNode({ entry, expandedDirs, onToggleDir, onSelect, selectedPath, depth }: FileTreeNodeProps) {
  const isExpanded = expandedDirs.has(entry.path)
  const isSelected = selectedPath === entry.path
  const isDirectory = entry.kind === 'directory'

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-0.5 cursor-pointer hover:bg-muted/50 transition-colors ${
          isSelected ? 'bg-muted text-foreground' : 'text-muted-foreground'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isDirectory) {
            onToggleDir(entry.path)
          } else {
            onSelect(entry)
          }
        }}
      >
        <span className="text-xs">{getFileIcon(entry.kind, entry.name)}</span>
        <span className="truncate">{entry.name}</span>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
