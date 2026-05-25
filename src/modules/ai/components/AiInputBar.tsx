import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { StopIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'
import { VoiceInput } from './VoiceInput'

type AiInputBarProps = {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  placeholder?: string
  className?: string
  onVoiceInput?: (transcript: string) => void
  voiceDisabled?: boolean
}

export function AiInputBar({ onSend, onStop, isStreaming, placeholder = 'Tanya AI atau ketik / untuk commands...', className, onVoiceInput, voiceDisabled }: AiInputBarProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setInput('')
  }, [input, isStreaming, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape' && isStreaming) {
      onStop()
    }
  }

  const handleVoiceInput = useCallback((text: string) => {
    setInput((prev) => prev + text)
    onVoiceInput?.(text)
  }, [onVoiceInput])

  return (
    <div className={cn('border-t border-[var(--color-border)] bg-[var(--color-surface)] p-2.5', className)}>
      <div
        className="overflow-hidden rounded-lg transition-all duration-150"
        style={{
          background: 'var(--color-raised)',
          border: '1px solid var(--color-border)',
          boxShadow: 'none',
        }}
        onFocusCapture={() => {
          const el = document.activeElement?.closest('[class*="overflow-hidden"]') as HTMLElement
          if (el) {
            el.style.borderColor = 'rgba(255,106,0,0.4)'
            el.style.boxShadow = '0 0 0 2px rgba(255,106,0,0.08)'
          }
        }}
        onBlurCapture={() => {
          const el = document.querySelector('[style*="border-color: rgba(255,106,0,0.4)"]') as HTMLElement
          if (el) {
            el.style.borderColor = 'var(--color-border)'
            el.style.boxShadow = 'none'
          }
        }}
      >
        <textarea
          ref={textareaRef as any}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-2.5 py-2 text-xs text-[var(--color-text-primary)] outline-none placeholder-[var(--color-text-muted)]"
          rows={2}
        />
        <div className="flex items-center gap-1 border-t border-[var(--color-border)] px-2 py-1">
          <button className="rounded p-0.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" title="Attach file">📎</button>
          {onVoiceInput && (
            <VoiceInput onTranscript={handleVoiceInput} disabled={voiceDisabled || isStreaming} />
          )}
          {!onVoiceInput && (
            <button className="rounded p-0.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" title="Voice input">🎤</button>
          )}
          <button className="rounded p-0.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]" title="Context">@</button>
          {isStreaming ? (
            <Button variant="destructive" size="icon-sm" onClick={onStop} title="Hentikan" className="ml-auto h-7 w-7">
              <HugeiconsIcon icon={StopIcon} size={14} strokeWidth={2} />
            </Button>
          ) : (
            <button
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-xs text-white shadow-sm transition-all hover:scale-105 disabled:opacity-40"
              style={{
                background: !input.trim() ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ff6a00, #6c7cff)',
                boxShadow: input.trim() ? '0 2px 8px rgba(255,106,0,0.3)' : 'none',
              }}
              onClick={handleSend}
              disabled={!input.trim()}
              title="Kirim (Enter)"
            >
              ➤
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
