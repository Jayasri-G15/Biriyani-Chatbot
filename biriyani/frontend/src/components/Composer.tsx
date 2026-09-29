import { useRef, useState, type KeyboardEvent, type ChangeEvent } from 'react'
import type { DocumentInfo } from '../types/chat'

interface Props {
  disabled: boolean
  onSend: (content: string, documentIds?: string[], attachedDocs?: DocumentInfo[]) => void
  documents: DocumentInfo[]
  onUploadDocument: (file: File) => Promise<void>
  onDeleteDocument: (documentId: string) => Promise<void>
  isUploadingDocument: boolean
}

// Web Speech API interfaces for browser support
interface SpeechRecognitionResult {
  readonly length: number
  isFinal?: boolean
  [index: number]: { transcript: string }
}
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    readonly length: number
    [index: number]: SpeechRecognitionResult
  }
}
interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt']
const MAX_FILE_SIZE_MB = 10

export function Composer({
  disabled,
  onSend,
  documents,
  onUploadDocument,
  onDeleteDocument,
  isUploadingDocument,
}: Props) {
  const [value, setValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const baseTextRef = useRef('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
    const docIds = documents.map((d) => d.id)
    onSend(trimmed, docIds, [...documents])
    setValue('')
    setVoiceError(null)
    setFileError(null)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const handlePlusClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum size allowed is ${MAX_FILE_SIZE_MB}MB.`)
      e.target.value = ''
      return
    }

    try {
      await onUploadDocument(file)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Document upload failed. Please try again.')
    } finally {
      e.target.value = ''
    }
  }

  const toggleVoiceInput = () => {
    setVoiceError(null)

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition

    if (!SpeechRecognitionClass) {
      setVoiceError('Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari.')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    try {
      baseTextRef.current = value
      const recognition = new SpeechRecognitionClass()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i]
          const text = res[0]?.transcript || ''
          if (res.isFinal) {
            finalTranscript += text
          } else {
            interimTranscript += text
          }
        }

        const currentSpeech = (finalTranscript + interimTranscript).trim()
        const initial = baseTextRef.current.trim()

        if (initial && currentSpeech) {
          setValue(`${initial} ${currentSpeech}`)
        } else if (currentSpeech) {
          setValue(currentSpeech)
        } else if (initial) {
          setValue(initial)
        }
      }

      recognition.onerror = (event: { error: string }) => {
        setIsListening(false)
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone access denied. Please allow microphone access in your browser settings.')
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Please speak into your microphone.')
        } else if (event.error !== 'aborted') {
          setVoiceError('Voice recognition failed. Please try speaking again.')
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
      recognitionRef.current = recognition
      setIsListening(true)
    } catch (err) {
      setIsListening(false)
      setVoiceError('Could not start microphone. Please check your browser microphone permissions.')
    }
  }

  return (
    <div className="border-t border-[var(--color-hairline)] bg-[var(--color-canvas-parchment)] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {/* Document pill badges in draft area */}
        {documents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 rounded-full border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-3 py-1 text-xs text-[var(--color-ink)] shadow-2xs"
              >
                <span>📄</span>
                <span className="max-w-40 truncate font-medium">{doc.filename}</span>
                <button
                  type="button"
                  onClick={() => onDeleteDocument(doc.id)}
                  aria-label={`Remove ${doc.filename}`}
                  className="rounded-full p-0.5 text-[var(--color-ink-muted-48)] hover:bg-black/10 dark:hover:bg-white/10 hover:text-[var(--color-ink)]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Status / Error messages */}
        {isUploadingDocument && (
          <div className="px-3 text-xs text-[var(--color-primary)] animate-pulse">
            Processing document text…
          </div>
        )}
        {fileError && (
          <div className="px-3 text-xs text-red-600 dark:text-red-400">{fileError}</div>
        )}
        {voiceError && (
          <div className="px-3 text-xs text-amber-600 dark:text-amber-400">{voiceError}</div>
        )}

        {/* Main Composer Row: [ + ] [ Ask anything... ] [ 🎤 ] [ Send ] */}
        <div
          className={`flex items-end gap-2 rounded-2xl border p-2 transition shadow-xs ${
            isListening
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-500/5'
              : 'border-[var(--color-hairline)] bg-[var(--color-canvas)] focus-within:border-[var(--color-primary-focus)] focus-within:ring-2 focus-within:ring-[var(--color-primary-focus)]/30'
          }`}
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* + Button for Document Upload */}
          <button
            type="button"
            onClick={handlePlusClick}
            disabled={disabled || isUploadingDocument}
            aria-label="Upload Document"
            title="Upload Document (PDF, DOCX, TXT)"
            className="btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-light text-[var(--color-ink-muted-80)] hover:bg-[var(--color-canvas-parchment)] hover:text-[var(--color-ink)] transition disabled:opacity-50"
          >
            +
          </button>

          {/* Input field */}
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={isListening ? 'Listening to your voice... Speak now' : 'Ask anything…'}
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent py-2 text-[16px] leading-relaxed tracking-tight text-[var(--color-ink)] placeholder-[var(--color-ink-muted-48)] outline-none"
          />

          {/* 🎤 Voice Input Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={disabled}
            aria-label="Voice Input"
            title={isListening ? 'Stop listening' : 'Start voice input'}
            className={`btn-press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : 'text-[var(--color-ink-muted-80)] hover:bg-[var(--color-canvas-parchment)] hover:text-[var(--color-ink)]'
            }`}
          >
            🎤
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            aria-label="Send Message"
            className="btn-press shrink-0 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-[15px] font-medium text-white transition hover:bg-[var(--color-primary-focus)] disabled:cursor-not-allowed disabled:bg-[var(--color-ink-muted-48)]"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
