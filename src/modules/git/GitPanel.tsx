import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface GitFileChange {
  status: string
  path: string
}

interface GitStatus {
  branch: string
  changes: GitFileChange[]
}

interface GitCommit {
  hash: string
  message: string
}

interface GitBranch {
  name: string
  current: boolean
}

export function GitPanel({ repoPath }: { repoPath: string }) {
  const [status, setStatus] = useState<GitStatus | null>(null)
  const [commits, setCommits] = useState<GitCommit[]>([])
  const [branches, setBranches] = useState<GitBranch[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [commitMsg, setCommitMsg] = useState('')
  const [diff, setDiff] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'changes' | 'log' | 'branches'>('changes')
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [s, c, b] = await Promise.all([
        invoke<GitStatus>('git_status', { path: repoPath }),
        invoke<GitCommit[]>('git_log', { path: repoPath, maxCount: 20 }),
        invoke<GitBranch[]>('git_branches', { path: repoPath }),
      ])
      setStatus(s)
      setCommits(c)
      setBranches(b)
    } catch {}
  }, [repoPath])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleFile = (path: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const showDiff = async (file?: string) => {
    try {
      const d = await invoke<string>('git_diff', {
        path: repoPath,
        file: file || null,
      })
      setDiff(d || 'No changes')
    } catch (e: any) {
      setDiff(`Error: ${e}`)
    }
  }

  const handleStage = async () => {
    if (selectedFiles.size === 0) return
    setLoading(true)
    try {
      await invoke('git_add', { path: repoPath, files: Array.from(selectedFiles) })
      setSelectedFiles(new Set())
      await refresh()
    } catch {}
    setLoading(false)
  }

  const handleCommit = async () => {
    if (!commitMsg.trim()) return
    setLoading(true)
    try {
      await invoke('git_commit', { path: repoPath, message: commitMsg })
      setCommitMsg('')
      setSelectedFiles(new Set())
      await refresh()
    } catch {}
    setLoading(false)
  }

  const switchBranch = async (branch: string) => {
    setLoading(true)
    try {
      await invoke('git_checkout', { path: repoPath, branch })
      await refresh()
    } catch {}
    setLoading(false)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-foreground">
          {status?.branch || 'git'}
        </span>
        <button
          onClick={refresh}
          className="text-[10px] text-muted-foreground hover:text-foreground"
        >
          ↻
        </button>
      </div>

      <div className="flex border-b border-border text-[10px]">
        {(['changes', 'log', 'branches'] as const).map((view) => (
          <button
            key={view}
            onClick={() => { setActiveView(view); setDiff(null) }}
            className={`flex-1 py-1.5 text-center capitalize ${
              activeView === view
                ? 'text-foreground border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {view}
            {view === 'changes' && status && (
              <span className="ml-1 text-[9px] text-muted-foreground">
                ({status.changes.length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {diff ? (
          <div className="p-3">
            <button
              onClick={() => setDiff(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground mb-2 block"
            >
              ← Back
            </button>
            <pre className="text-[10px] font-mono text-foreground whitespace-pre-wrap">
              {diff}
            </pre>
          </div>
        ) : activeView === 'changes' && status ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              {status.changes.map((change) => (
                <div
                  key={change.path}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer"
                  onClick={() => showDiff(change.path)}
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(change.path)}
                    onChange={() => toggleFile(change.path)}
                    className="w-3 h-3"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span
                    className={`text-[10px] font-mono w-6 ${
                      change.status === 'M'
                        ? 'text-yellow-400'
                        : change.status === '??'
                        ? 'text-green-400'
                        : change.status === 'D'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {change.status}
                  </span>
                  <span className="text-xs text-foreground truncate">
                    {change.path}
                  </span>
                </div>
              ))}
              {status.changes.length === 0 && (
                <div className="p-4 text-xs text-muted-foreground text-center">
                  No changes
                </div>
              )}
            </div>
            {status.changes.length > 0 && (
              <div className="border-t border-border p-2 flex flex-col gap-1.5">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={commitMsg}
                    onChange={(e) => setCommitMsg(e.target.value)}
                    placeholder="Commit message"
                    className="flex-1 bg-muted text-foreground text-xs rounded px-2 py-1 border border-border outline-none"
                  />
                  <button
                    onClick={handleStage}
                    disabled={selectedFiles.size === 0 || loading}
                    className="text-[10px] bg-muted text-foreground rounded px-2 py-1 disabled:opacity-50"
                  >
                    Stage
                  </button>
                </div>
                <button
                  onClick={handleCommit}
                  disabled={!commitMsg.trim() || loading}
                  className="text-xs bg-primary text-primary-foreground rounded py-1 disabled:opacity-50"
                >
                  Commit {selectedFiles.size > 0 ? `(${selectedFiles.size} files)` : ''}
                </button>
              </div>
            )}
          </div>
        ) : activeView === 'log' ? (
          <div>
            {commits.map((c) => (
              <div
                key={c.hash}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 text-xs"
              >
                <span className="text-[10px] font-mono text-primary">{c.hash.slice(0, 7)}</span>
                <span className="text-foreground truncate">{c.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {branches.map((b) => (
              <div
                key={b.name}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {b.current && <span className="text-[10px] text-primary">*</span>}
                  <span className={`text-xs ${b.current ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {b.name}
                  </span>
                </div>
                {!b.current && (
                  <button
                    onClick={() => switchBranch(b.name)}
                    disabled={loading}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    switch
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
