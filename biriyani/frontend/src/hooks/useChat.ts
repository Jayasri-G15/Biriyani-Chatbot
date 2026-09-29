import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, ApiError, streamMessage } from '../api/client'
import type { DocumentInfo, Message } from '../types/chat'

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingContent, setPendingContent] = useState('')
  const [failedDraft, setFailedDraft] = useState<string | null>(null)
  const qc = useQueryClient()

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    setIsLoadingHistory(true)
    setError(null)
    api
      .listMessages(conversationId)
      .then(setMessages)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load this conversation.'))
      .finally(() => setIsLoadingHistory(false))
  }, [conversationId])

  const send = useCallback(
    async (content: string, documentIds?: string[], attachedDocs?: DocumentInfo[]) => {
      if (!conversationId) return
      setError(null)
      setFailedDraft(null)
      const userMessage: Message = {
        id: `local-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        status: 'complete',
        created_at: new Date().toISOString(),
        documents: attachedDocs ?? [],
      }
      setMessages((prev) => [...prev, userMessage])
      setIsStreaming(true)
      setPendingContent('')

      let assembled = ''
      try {
        for await (const event of streamMessage(conversationId, content, documentIds)) {
          if (event.type === 'delta') {
            assembled += event.content
            setPendingContent(assembled)
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `local-reply-${Date.now()}`,
            conversation_id: conversationId,
            role: 'assistant',
            content: assembled,
            status: 'complete',
            created_at: new Date().toISOString(),
          },
        ])
        qc.invalidateQueries({ queryKey: ['conversations'] })
        qc.invalidateQueries({ queryKey: ['documents', conversationId] })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
        setFailedDraft(content)
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      } finally {
        setIsStreaming(false)
        setPendingContent('')
      }
    },
    [conversationId, qc],
  )

  const retry = useCallback(() => {
    if (failedDraft) {
      const draft = failedDraft
      setFailedDraft(null)
      void send(draft)
    }
  }, [failedDraft, send])

  return { messages, isLoadingHistory, isStreaming, pendingContent, error, failedDraft, send, retry }
}

export function useAutoScroll(dep: unknown) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [dep])
  return ref
}
