import { useApprovalStore } from '../lib/agent'

export function ApprovalDialog() {
  const pending = useApprovalStore((s) => s.pending)
  const approve = useApprovalStore((s) => s.approve)
  const reject = useApprovalStore((s) => s.reject)

  if (pending.length === 0) return null

  const item = pending[0]

  return (
    <div className="fixed inset-0 flex items-end justify-center pb-16 pointer-events-none z-50">
      <div className="bg-background border border-border rounded-lg shadow-xl p-4 max-w-md w-full mx-4 pointer-events-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-foreground uppercase">⚠️ Approval Required</span>
        </div>
        <div className="bg-muted rounded p-2 mb-3 font-mono text-xs text-foreground">
          <div className="font-semibold text-primary">{item.tool}</div>
          <pre className="mt-1 text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(item.args, null, 2)}
          </pre>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => reject(item.id)}
            className="text-xs px-3 py-1.5 rounded bg-muted text-foreground hover:bg-border transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => approve(item.id)}
            className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
