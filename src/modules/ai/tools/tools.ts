import { invoke } from '@tauri-apps/api/core'
import { assertPathSafe } from '../lib/security'

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  needsApproval: boolean
  execute: (args: Record<string, unknown>) => Promise<string>
}

// ─── FS Tools (auto-execute) ────────────────────────────────

async function readFile(args: Record<string, unknown>): Promise<string> {
  const path = args.path as string
  assertPathSafe(path)
  try {
    const content = await invoke<string>('fs_read_file', { path })
    return content
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function listDirectory(args: Record<string, unknown>): Promise<string> {
  const path = args.path as string
  try {
    const tree = await invoke<string>('fs_read_tree', { path })
    return tree
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function fsSearch(args: Record<string, unknown>): Promise<string> {
  const { pattern, path: searchPath } = args as { pattern: string; path?: string }
  try {
    const { fsSearch } = await import('../../explorer/lib/fs-bridge')
    const results = await fsSearch(pattern, searchPath)
    return results.length > 0
      ? results.join('\n')
      : 'No results found.'
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function fsGrep(args: Record<string, unknown>): Promise<string> {
  const { pattern, path: searchPath } = args as { pattern: string; path?: string }
  try {
    const { fsGrep } = await import('../../explorer/lib/fs-bridge')
    const results = await fsGrep(pattern, searchPath)
    return results.length > 0
      ? results.map((r: any) => `${r.path}:${r.line}: ${r.content}`).join('\n')
      : 'No matches found.'
  } catch (e: any) {
    return `Error: ${e}`
  }
}

// ─── FS Mutation Tools (needs approval) ─────────────────────

async function writeFile(args: Record<string, unknown>): Promise<string> {
  const { path, content } = args as { path: string; content: string }
  assertPathSafe(path)
  try {
    await invoke('fs_write_file', { path, content })
    return `File written: ${path}`
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function createDirectory(args: Record<string, unknown>): Promise<string> {
  const path = args.path as string
  try {
    await invoke('fs_create_dir', { path })
    return `Directory created: ${path}`
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function rename(args: Record<string, unknown>): Promise<string> {
  const { oldPath, newPath } = args as { oldPath: string; newPath: string }
  assertPathSafe(oldPath)
  assertPathSafe(newPath)
  try {
    await invoke('fs_rename', { oldPath, newPath })
    return `Renamed: ${oldPath} → ${newPath}`
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function deletePath(args: Record<string, unknown>): Promise<string> {
  const path = args.path as string
  assertPathSafe(path)
  try {
    await invoke('fs_delete', { path })
    return `Deleted: ${path}`
  } catch (e: any) {
    return `Error: ${e}`
  }
}

// ─── Shell Tools (needs approval) ───────────────────────────

async function runCommand(args: Record<string, unknown>): Promise<string> {
  const { command, cwd, timeoutSecs } = args as {
    command: string
    cwd?: string
    timeoutSecs?: number
  }
  try {
    const result = await invoke<{ stdout: string; stderr: string; exit_code: number }>(
      'shell_run_command',
      { command, cwd: cwd || null, timeoutSecs: timeoutSecs || 30 }
    )
    let out = ''
    if (result.stdout) out += result.stdout
    if (result.stderr) out += '\n' + result.stderr
    out += `\nExit code: ${result.exit_code}`
    return out
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function shellSessionRun(args: Record<string, unknown>): Promise<string> {
  const { sessionId, input } = args as { sessionId: string; input: string }
  try {
    await invoke('shell_session_write', { sessionId, input })
    // Small delay for command to execute
    await new Promise((r) => setTimeout(r, 500))
    const output = await invoke<string>('shell_session_read', { sessionId })
    return output
  } catch (e: any) {
    return `Error: ${e}`
  }
}

async function shellBgSpawn(args: Record<string, unknown>): Promise<string> {
  const { command, cwd } = args as { command: string; cwd?: string }
  try {
    const id = await invoke<string>('shell_bg_spawn', { command, cwd: cwd || null })
    return `Background process started: ${id}`
  } catch (e: any) {
    return `Error: ${e}`
  }
}

// ─── Tool Registry ──────────────────────────────────────────

export function getTools(): ToolDefinition[] {
  return [
    {
      name: 'read_file',
      description: 'Read the contents of a file at the given path',
      parameters: { path: { type: 'string', description: 'Absolute path to the file' } },
      needsApproval: false,
      execute: readFile,
    },
    {
      name: 'list_directory',
      description: 'List files and directories in a given path',
      parameters: { path: { type: 'string', description: 'Absolute path to the directory' } },
      needsApproval: false,
      execute: listDirectory,
    },
    {
      name: 'fs_search',
      description: 'Fuzzy search for files by name pattern',
      parameters: {
        pattern: { type: 'string', description: 'Filename pattern to search for' },
        path: { type: 'string', description: 'Root path to search in (optional)' },
      },
      needsApproval: false,
      execute: fsSearch,
    },
    {
      name: 'fs_grep',
      description: 'Search file contents for a regex pattern',
      parameters: {
        pattern: { type: 'string', description: 'Regex pattern to search for' },
        path: { type: 'string', description: 'Root path to search in (optional)' },
      },
      needsApproval: false,
      execute: fsGrep,
    },
    {
      name: 'write_file',
      description: 'Write content to a file (creates or overwrites)',
      parameters: {
        path: { type: 'string', description: 'Absolute path to the file' },
        content: { type: 'string', description: 'File content to write' },
      },
      needsApproval: true,
      execute: writeFile,
    },
    {
      name: 'create_directory',
      description: 'Create a new directory',
      parameters: { path: { type: 'string', description: 'Absolute path to the directory' } },
      needsApproval: true,
      execute: createDirectory,
    },
    {
      name: 'rename',
      description: 'Rename or move a file or directory',
      parameters: {
        oldPath: { type: 'string', description: 'Current path' },
        newPath: { type: 'string', description: 'New path' },
      },
      needsApproval: true,
      execute: rename,
    },
    {
      name: 'delete',
      description: 'Delete a file or empty directory',
      parameters: { path: { type: 'string', description: 'Absolute path to delete' } },
      needsApproval: true,
      execute: deletePath,
    },
    {
      name: 'run_command',
      description: 'Run a shell command (one-shot, with timeout)',
      parameters: {
        command: { type: 'string', description: 'Shell command to execute' },
        cwd: { type: 'string', description: 'Working directory (optional)' },
        timeoutSecs: { type: 'number', description: 'Timeout in seconds (default 30)' },
      },
      needsApproval: true,
      execute: runCommand,
    },
    {
      name: 'shell_session_run',
      description: 'Write input to a persistent shell session and read output',
      parameters: {
        sessionId: { type: 'string', description: 'Session ID from shell_session_create' },
        input: { type: 'string', description: 'Command to send to the session' },
      },
      needsApproval: true,
      execute: shellSessionRun,
    },
    {
      name: 'shell_bg_spawn',
      description: 'Start a long-running background process (dev server, watcher)',
      parameters: {
        command: { type: 'string', description: 'Command to run in background' },
        cwd: { type: 'string', description: 'Working directory (optional)' },
      },
      needsApproval: true,
      execute: shellBgSpawn,
    },
  ]
}
