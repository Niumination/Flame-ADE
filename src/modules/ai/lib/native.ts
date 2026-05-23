import { invoke } from '@tauri-apps/api/core'
import { useTabs } from '@/modules/tabs'
import { useWorkspace } from '@/modules/explorer/lib/useWorkspace'

export const native = {
  getCwd: async (sessionId?: string): Promise<string> => {
    const s = useTabs.getState()
    const tab = s.tabs.find((t) => t.id === (sessionId || s.activeTabId))
    return tab?.cwd || ''
  },
  readFile: async (path: string): Promise<string> => {
    const r = await invoke<string>('fs_read_file', { path })
    return r
  },
  writeFile: async (path: string, content: string): Promise<void> => {
    await invoke('fs_write_file', { path, content })
  },
  listFiles: async (path: string): Promise<string[]> => {
    try {
      const r = await invoke<string[]>('fs_search', { pattern: '', rootPath: path })
      return r
    } catch {
      return []
    }
  },
  gitLog: async (params?: { path?: string; maxCount?: number }): Promise<any[]> => {
    const r = await invoke<any[]>('git_log', {
      path: params?.path || useWorkspace.getState().workspacePath || '',
      maxCount: params?.maxCount || 10,
    })
    return r
  },
  gitDiff: async (params?: { path?: string }): Promise<string> => {
    const r = await invoke<string>('git_diff', { path: params?.path || '' })
    return r
  },
  gitStatus: async (): Promise<any> => {
    const r = await invoke<any>('git_status', {
      path: useWorkspace.getState().workspacePath || '',
    })
    return r
  },
  shellRun: async (command: string, cwd?: string): Promise<string> => {
    const r = await invoke<{ stdout: string; stderr: string; exit_code: number; timed_out: boolean; truncated: boolean }>('shell_run_command', { command, cwd })
    return r.stdout
  },
  fsGrep: async (params: { pattern: string; path: string }): Promise<any[]> => {
    const r = await invoke<any[]>('fs_grep', { pattern: params.pattern, rootPath: params.path })
    return r
  },
  fsSearch: async (params: { query: string; root: string }): Promise<string[]> => {
    const r = await invoke<string[]>('fs_search', { pattern: params.query, rootPath: params.root })
    return r
  },
}

export async function listDirectory(path: string): Promise<string[]> {
  return native.listFiles(path)
}
