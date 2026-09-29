import { useChat, useAutoScroll } from '../hooks/useChat'
import { useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useDocuments'
import { MessageBubble, TypingBubble } from './MessageBubble'
import { Composer } from './Composer'

export function ChatWindow({ conversationId }: { conversationId: string | null }) {
  const { messages, isLoadingHistory, isStreaming, pendingContent, error, failedDraft, send, retry } =
    useChat(conversationId)
  const { data: documents = [] } = useDocuments(conversationId)
  const uploadDocMutation = useUploadDocument()
  const deleteDocMutation = useDeleteDocument()

  const unattachedDocuments = documents.filter((d) => !d.message_id)

  const bottomRef = useAutoScroll(messages.length + pendingContent.length)

  const handleUploadDocument = async (file: File) => {
    if (!conversationId) return
    await uploadDocMutation.mutateAsync({ conversationId, file })
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!conversationId) return
    await deleteDocMutation.mutateAsync({ conversationId, documentId })
  }

  if (!conversationId) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 bg-[var(--color-canvas-parchment)] px-6 text-center">
        <div className="text-5xl">💬</div>
        <p className="text-[26px] font-medium tracking-tight text-[var(--color-ink)]">
          Start a new chat to begin
        </p>
        <p className="max-w-sm text-[15px] leading-relaxed text-[var(--color-ink-muted-48)]">
          Pick a conversation on the left sidebar, or create a new one.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-[var(--color-canvas-parchment)]">
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {isLoadingHistory && (
            <p className="text-center text-[14px] text-[var(--color-ink-muted-48)]">Loading messages…</p>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isStreaming && <TypingBubble content={pendingContent} />}
          {error && (
            <div className="message-in flex flex-col items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/40 p-4 text-center text-[14px] text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
              <span>{error}</span>
              {failedDraft && (
                <button
                  onClick={retry}
                  className="btn-press rounded-xl bg-red-600 px-4 py-1.5 text-[14px] font-medium text-white hover:bg-red-700"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <Composer
        disabled={isStreaming}
        onSend={send}
        documents={unattachedDocuments}
        onUploadDocument={handleUploadDocument}
        onDeleteDocument={handleDeleteDocument}
        isUploadingDocument={uploadDocMutation.isPending}
      />
    </div>
  )
}
