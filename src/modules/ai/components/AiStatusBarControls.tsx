import { AgentStatusPill } from './AgentStatusPill'
import { Button } from '@/components/ui/button'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useChatStore } from '../store/chatStore'

export function AiStatusBarControls() {
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const clearMessages = useChatStore((s) => s.clearMessages)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 text-muted-foreground hover:text-foreground"
        onClick={() => activeSessionId && clearMessages(activeSessionId)}
        title="Hapus percakapan"
      >
        <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={1.75} />
      </Button>
      <AgentStatusPill onClick={() => {}} />
    </div>
  )
}
