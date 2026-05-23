import { invoke } from '@tauri-apps/api/core'

export interface TerminalApp {
  id: string
  name: string
  path: string
}

export async function terminalListApps(): Promise<TerminalApp[]> {
  return invoke<TerminalApp[]>('terminal_list_apps')
}

export async function terminalOpen(cwd: string, terminalId: string): Promise<void> {
  return invoke('terminal_open', { cwd, terminalId })
}
