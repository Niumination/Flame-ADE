import { AiChat } from './AiChat'
import { AiInputBar } from './AiInputBar'
import { useChatStore } from '../store/chatStore'
import { Button } from '@/components/ui/button'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

type AiMiniWindowProps = {
  onClose: () => void
}

export function AiMiniWindow({ onClose }: AiMiniWindowProps) {
  const sessions = useChatStore((s) => s.sessions)
  const activeSessionId = useChatStore((s) => s.activeSessionId)
  const session = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="fixed bottom-12 right-4 z-50 flex h-96 w-80 flex-col rounded-2xl border border-border bg-popover shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium">AI Chat</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
        </Button>
      </div>
      <AiChat messages={session?.messages || []} isStreaming={false} />
      <AiInputBar onSend={() => {}} onStop={() => {}} isStreaming={false} />
    </div>
  )
}
