import { useEffect, useState } from 'react'
import { useApprovalStore } from '../lib/agent'

export function ApprovalDialog() {
  const pending = useApprovalStore((s) => s.pending)
  const approve = useApprovalStore((s) => s.approve)
  const reject = useApprovalStore((s) => s.reject)

  const [timer, setTimer] = useState(100)

  useEffect(() => {
    if (pending.length === 0) { setTimer(100); return }
    setTimer(100)
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval)
          reject(pending[0].id)
          return 0
        }
        return t - 1.67
      })
    }, 300)
    return () => clearInterval(interval)
  }, [pending.length, pending[0]?.id])

  if (pending.length === 0) return null

  const item = pending[0]

  return (
    <div
      className="fixed z-[999]"
      style={{
        bottom: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 440,
        animation: 'dialogSlideUp 0.3s ease',
      }}
    >
      <div
        className="rounded-lg border px-4 py-3.5 shadow-2xl"
        style={{
          background: 'var(--color-overlay)',
          borderColor: 'rgba(255,106,0,0.4)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,106,0,0.1)',
        }}
      >
        {/* Header */}
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#f59e0b]">
          ⚠️ Tool Approval Required
        </div>

        {/* Description */}
        <div className="mb-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
          Flame AI ingin menjalankan operasi <strong style={{ color: '#f59e0b' }}>{item.tool}</strong> yang akan memodifikasi file berikut:
        </div>

        {/* Code block */}
        <div
          className="mb-3 overflow-auto rounded border px-2.5 py-2 font-mono text-[11px] text-[#22c55e]"
          style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)' }}
        >
          {JSON.stringify(item.args, null, 2)}
        </div>

        {/* Timer bar */}
        <div className="mb-3 h-1 overflow-hidden rounded-full" style={{ background: 'var(--color-raised)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${timer}%`,
              background: timer > 30 ? 'linear-gradient(90deg, #ff6a00, #f59e0b)' : 'var(--color-red)',
              transition: 'width 0.3s linear',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => reject(item.id)}
            className="rounded border px-3 py-1 text-[11.5px] font-medium transition-colors"
            style={{ borderColor: 'color-mix(in srgb, var(--color-red) 40%, transparent)', color: 'var(--color-red)', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-red) 10%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            ✕ Tolak
          </button>
          <button
            onClick={() => approve(item.id)}
            className="rounded border px-3 py-1 text-[11.5px] font-medium transition-colors"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-green) 40%, transparent)',
              color: 'var(--color-green)',
              background: 'color-mix(in srgb, var(--color-green) 15%, transparent)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-green) 25%, transparent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-green) 15%, transparent)' }}
          >
            ✓ Setujui
          </button>
        </div>
      </div>
    </div>
  )
}
