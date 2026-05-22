import { invoke } from '@tauri-apps/api/core'

const DENIED_PATTERNS = [
  /\.env$/i,
  /\.env\.\w+$/i,
  /\.ssh\//,
  /\.aws\//,
  /\.gcloud\//,
  /id_rsa/,
  /\.pem$/i,
  /\.key$/i,
]

function assertPathSafe(path: string): void {
  if (DENIED_PATTERNS.some((pattern) => pattern.test(path))) {
    throw new Error(`Access denied: path contains sensitive pattern`)
  }
}

export interface FileEntry {
  name: string
  path: string
  kind: 'file' | 'directory' | 'symlink'
  size?: number
  children?: FileEntry[]
}

export interface GrepMatch {
  path: string
  line: number
  content: string
}

export async function readTree(path: string, depth = 2): Promise<FileEntry[]> {
  return invoke<FileEntry[]>('fs_read_tree', { path, depth })
}

export async function readFile(path: string): Promise<string> {
  assertPathSafe(path)
  return invoke<string>('fs_read_file', { path })
}

export async function writeFile(path: string, content: string): Promise<void> {
  assertPathSafe(path)
  return invoke('fs_write_file', { path, content })
}

export async function createDir(path: string): Promise<void> {
  assertPathSafe(path)
  return invoke('fs_create_dir', { path })
}

export async function deletePath(path: string): Promise<void> {
  assertPathSafe(path)
  return invoke('fs_delete', { path })
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  assertPathSafe(oldPath)
  assertPathSafe(newPath)
  return invoke('fs_rename', { oldPath, newPath })
}

export async function exists(path: string): Promise<boolean> {
  assertPathSafe(path)
  return invoke<boolean>('fs_exists', { path })
}

export async function fsSearch(pattern: string, rootPath?: string): Promise<string[]> {
  return invoke<string[]>('fs_search', { pattern, rootPath: rootPath || null })
}

export async function fsGrep(pattern: string, rootPath?: string): Promise<GrepMatch[]> {
  return invoke<GrepMatch[]>('fs_grep', { pattern, rootPath: rootPath || null })
}
