import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<any>(null)
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    if (!isSupported) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setInterimText(interim)
      if (final) {
        onTranscriptRef.current(final)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [isSupported])

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      setIsListening(false)
      setInterimText('')
    } else {
      recognition.start()
      setIsListening(true)
    }
  }, [isListening])

  if (!isSupported) return null

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      className={`relative flex items-center justify-center w-7 h-7 rounded transition-colors ${
        isListening
          ? 'bg-destructive text-white animate-pulse'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      } disabled:opacity-50`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
      {isListening && interimText && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground bg-background border border-border rounded px-1.5 py-0.5 whitespace-nowrap max-w-40 truncate">
          {interimText}
        </span>
      )}
    </button>
  )
}
