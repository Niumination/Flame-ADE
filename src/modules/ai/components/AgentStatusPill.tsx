import { cn } from '@/lib/utils'
import { useChatStore } from '../store/chatStore'

type AgentStatusPillProps = {
  onClick?: () => void
  className?: string
}

export function AgentStatusPill({ onClick, className }: AgentStatusPillProps) {
  const isStreaming = useChatStore((s) => s.isStreaming)

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors',
        isStreaming
          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 animate-pulse'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted',
        className,
      )}
    >
      <span className={cn('inline-block size-1.5 rounded-full', isStreaming ? 'bg-blue-500' : 'bg-muted-foreground/50')} />
      <span>{isStreaming ? 'AI aktif' : 'AI siap'}</span>
    </button>
  )
}
