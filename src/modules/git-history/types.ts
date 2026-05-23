export interface GitLogEntry {
  sha: string
  shortSha: string
  subject: string
  author: string
  authorEmail: string
  timestampSecs: number
  parents: string[]
  insertions: number
  deletions: number
  filesChanged: number
}

export interface GitCommitFileChange {
  path: string
  originalPath: string | null
  status: string
  statusLabel: string
  added: number
  removed: number
  isBinary: boolean
}

export type CommitFileDiffOpenInput = {
  repoRoot: string
  sha: string
  shortSha: string
  subject: string
  path: string
  originalPath: string | null
}
