import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl',
        className,
      )}
    >
      {children}
    </div>
  )
}
