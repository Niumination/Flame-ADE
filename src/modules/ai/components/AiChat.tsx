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
    <div className={cn('flex-1 overflow-y-auto p-4 space-y-3', className)}>
      {messages.map((msg) => (
        <div key={msg.id} className="flex flex-col gap-1 max-w-full">
          {/* Role label */}
          <div className="flex items-center gap-1.5">
            <span
              className="flex h-3.5 w-3.5 items-center justify-center rounded text-[9px]"
              style={
                msg.role === 'user'
                  ? { background: 'color-mix(in srgb, var(--color-indigo) 20%, transparent)', color: 'var(--color-indigo)' }
                  : { background: 'color-mix(in srgb, #ff6a00 15%, transparent)', color: '#ff9f45' }
              }
            >
              {msg.role === 'user' ? '👤' : '🔥'}
            </span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--color-text-secondary)]">
              {msg.role === 'user' ? 'You' : 'Flame AI'}
            </span>
          </div>

          {/* Bubble */}
          <div
            className="rounded-lg px-3 py-2 text-xs leading-relaxed backdrop-blur-sm"
            style={
              msg.role === 'user'
                ? { background: 'color-mix(in srgb, var(--color-indigo) 12%, var(--color-base))', border: '1px solid color-mix(in srgb, var(--color-indigo) 25%, transparent)', color: 'var(--color-text-primary)' }
                : { background: 'color-mix(in srgb, #ff6a00 6%, var(--color-base))', border: '1px solid color-mix(in srgb, #ff6a00 15%, transparent)', color: 'var(--color-text-secondary)' }
            }
          >
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded text-[9px]" style={{ background: 'rgba(255,106,0,0.15)', color: '#ff9f45' }}>🔥</span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[var(--color-text-secondary)]">Flame AI</span>
            <span className="ml-1 text-[9px] text-[#ff6a00]">● streaming…</span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 backdrop-blur-sm"
            style={{ background: 'color-mix(in srgb, #ff6a00 6%, var(--color-base))', border: '1px solid color-mix(in srgb, #ff6a00 15%, transparent)' }}
          >
            {[0, 0.15, 0.3].map((delay, i) => (
              <span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: '#ff9f45',
                  animation: `cssBounce 0.8s ${delay}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
})
