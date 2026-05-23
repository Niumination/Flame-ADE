import { useRef, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'
import { Streamdown } from 'streamdown'
import { MarkdownCode } from '@/components/ai-elements/markdown-code'
import type { ChatMessage } from '../store/chatStore'

type AiChatProps = {
  messages: ChatMessage[]
  isStreaming: boolean
  className?: string
}

export const AiChat = memo(function AiChat({ messages, isStreaming, className }: AiChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center', className)}>
        <div className="text-4xl opacity-30">🤖</div>
        <div className="text-sm text-muted-foreground max-w-xs">
          Mulai percakapan dengan AI. Ketik pesan di bawah, atau gunakan /commands untuk skill khusus.
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}>
      {messages.map((msg) => (
        <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
          <div className={cn(
            'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
            msg.role === 'user'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-foreground',
          )}>
            {msg.role === 'user' ? (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            ) : (
              <Streamdown BlockComponent={MarkdownCode}>
                {msg.content}
              </Streamdown>
            )}
          </div>
        </div>
      ))}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-muted/50 px-4 py-2">
            <span className="inline-flex gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0.2s]" />
            </span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
})
