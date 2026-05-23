import { create } from 'zustand'

export type WorkspaceEnv = { kind: 'local' }

type State = {
  env: WorkspaceEnv
  setEnv: (env: WorkspaceEnv) => void
}

export const LOCAL_WORKSPACE: WorkspaceEnv = { kind: 'local' }

export const useWorkspaceEnvStore = create<State>((set) => ({
  env: LOCAL_WORKSPACE,
  setEnv: (env) => set({ env }),
}))

export function currentWorkspaceEnv(): WorkspaceEnv {
  return useWorkspaceEnvStore.getState().env
}

export function workspaceScopeKey(_env?: WorkspaceEnv): string {
  return 'local'
}

export function currentWorkspaceScopeKey(): string {
  return 'local'
}
