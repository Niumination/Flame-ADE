import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl border',
        className,
      )}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-base) 70%, transparent)',
        borderColor: 'color-mix(in srgb, var(--color-border) 50%, transparent)',
      }}
    >
      {children}
    </div>
  )
}
