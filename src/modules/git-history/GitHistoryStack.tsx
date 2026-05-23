import { GitHistoryPane, type GitHistorySearchHandle } from "./GitHistoryPane"

type CommitFileDiffOpenInput = {
  repoRoot: string
  sha: string
  shortSha: string
  subject: string
  path: string
  originalPath: string | null
}

type Props = {
  repoRoot: string
  onOpenCommitFile: (input: CommitFileDiffOpenInput) => void
  onSearchHandle?: (handle: GitHistorySearchHandle | null) => void
}

export function GitHistoryStack({ repoRoot, onOpenCommitFile, onSearchHandle }: Props) {
  return (
    <GitHistoryPane
      repoRoot={repoRoot}
      onOpenCommitFile={onOpenCommitFile}
      onSearchHandle={onSearchHandle}
    />
  )
}
