import { useState, useCallback } from 'react'
import type { FileEntry } from './fs-bridge'
import { readTree, writeFile, createDir, deletePath, renamePath } from './fs-bridge'

export function useExplorer(rootPath: string) {
  const [tree, setTree] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await readTree(rootPath)
      setTree(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [rootPath])

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

  const handleRename = useCallback(async (oldPath: string, newName: string) => {
    const parent = oldPath.split(/[\\/]/).slice(0, -1).join('/')
    const newPath = `${parent}/${newName}`
    await renamePath(oldPath, newPath)
    await refresh()
  }, [refresh])

  const handleDelete = useCallback(async (path: string) => {
    await deletePath(path)
    await refresh()
  }, [refresh])

  const handleCreateFile = useCallback(async (parentPath: string, name: string) => {
    const fullPath = `${parentPath}/${name}`
    await writeFile(fullPath, '')
    await refresh()
  }, [refresh])

  const handleCreateDir = useCallback(async (parentPath: string, name: string) => {
    const fullPath = `${parentPath}/${name}`
    await createDir(fullPath)
    await refresh()
  }, [refresh])

  return {
    tree,
    loading,
    error,
    expandedDirs,
    refresh,
    toggleDir,
    renameFile: handleRename,
    deletePath: handleDelete,
    createFile: handleCreateFile,
    createDir: handleCreateDir,
  }
}
