import { useState, useMemo } from 'react'
import { diffLines, type Change } from 'diff'

interface Hunk {
  index: number
  changes: Change[]
  accepted: boolean
}

export function EditDiff({
  original,
  modified,
  filename,
  onAccept,
  onReject,
}: {
  original: string
  modified: string
  filename: string
  onAccept: (acceptedHunks: number[]) => void
  onReject: () => void
}) {
  const changes = useMemo(() => diffLines(original, modified), [original, modified])

  const hunks = useMemo(() => {
    const result: Hunk[] = []
    let currentHunk: Change[] = []
    let hunkIndex = 0

    changes.forEach((change) => {
      if (change.added || change.removed) {
        currentHunk.push(change)
      } else if (currentHunk.length > 0) {
        result.push({ index: hunkIndex++, changes: [...currentHunk], accepted: true })
        currentHunk = []
      }
    })
    if (currentHunk.length > 0) {
      result.push({ index: hunkIndex++, changes: [...currentHunk], accepted: true })
    }

    return result
  }, [changes])

  const [hunkStates, setHunkStates] = useState(hunks)
  const hasChanges = hunks.length > 0

  const toggleHunk = (index: number) => {
    setHunkStates((prev) =>
      prev.map((h) => (h.index === index ? { ...h, accepted: !h.accepted } : h))
    )
  }

  const handleAcceptSelected = () => {
    const accepted = hunkStates.filter((h) => h.accepted).map((h) => h.index)
    onAccept(accepted)
  }

  if (!hasChanges) {
    return (
      <div className="p-4 text-xs text-muted-foreground text-center">
        No changes detected.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold text-foreground">{filename}</span>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="text-xs px-2 py-1 rounded bg-muted text-foreground hover:bg-border"
          >
            Reject all
          </button>
          <button
            onClick={handleAcceptSelected}
            className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
          >
            Accept selected
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed">
        {hunkStates.map((hunk) => (
          <div key={hunk.index} className="border-b border-border">
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50">
              <button
                onClick={() => toggleHunk(hunk.index)}
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  hunk.accepted
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {hunk.accepted ? '✓ Accepted' : '✕ Rejected'}
              </button>
              <span className="text-[10px] text-muted-foreground">
                Hunk {hunk.index + 1}
              </span>
            </div>
            <div className={`px-3 ${hunk.accepted ? '' : 'opacity-40'}`}>
              {hunk.changes.map((change, i) => (
                <div
                  key={i}
                  className={`${
                    change.added
                      ? 'bg-green-900/30 text-green-300'
                      : change.removed
                      ? 'bg-red-900/30 text-red-300'
                      : ''
                  } px-2 whitespace-pre`}
                >
                  {change.added ? '+ ' : change.removed ? '- ' : '  '}
                  {change.value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
