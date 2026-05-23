import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight02Icon, StopIcon } from '@hugeicons/core-free-icons'
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
    <div className={cn('flex items-end gap-2 border-t border-border/60 bg-card p-3', className)}>
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-9 max-h-32 flex-1 resize-none text-sm"
        rows={1}
      />
      {onVoiceInput && (
        <VoiceInput onTranscript={handleVoiceInput} disabled={voiceDisabled || isStreaming} />
      )}
      {isStreaming ? (
        <Button variant="destructive" size="icon" onClick={onStop} title="Hentikan">
          <HugeiconsIcon icon={StopIcon} size={16} strokeWidth={2} />
        </Button>
      ) : (
        <Button variant="default" size="icon" onClick={handleSend} disabled={!input.trim()} title="Kirim">
          <HugeiconsIcon icon={ArrowRight02Icon} size={16} strokeWidth={2} />
        </Button>
      )}
    </div>
  )
}
