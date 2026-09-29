import ReactMarkdown from 'react-markdown'
import type { DocumentInfo, Message } from '../types/chat'

function DocumentCard({ doc }: { doc: DocumentInfo }) {
  const ext = doc.filename.split('.').pop()?.toUpperCase() || doc.file_type.toUpperCase()
  const isPdf = ext === 'PDF'

  return (
    <div className="mb-2.5 flex items-center gap-3.5 rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-3 shadow-2xs min-w-56 max-w-sm transition">
      {/* File type icon badge */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
          isPdf
            ? 'bg-red-500/10 text-red-600 border border-red-500/20'
            : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
        }`}
      >
        <div className="flex flex-col items-center leading-none gap-0.5">
          <span className="text-sm">📄</span>
          <span className="text-[9px] tracking-wider">{ext}</span>
        </div>
      </div>

      {/* File details */}
      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm font-medium text-[var(--color-ink)]" title={doc.filename}>
          {doc.filename}
        </span>
        <span className="text-xs font-semibold text-[var(--color-ink-muted-48)] uppercase tracking-wider">
          {ext}
        </span>
      </div>
    </div>
  )
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const hasDocuments = message.documents && message.documents.length > 0

  return (
    <div className={`message-in flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Attached documents card list */}
      {hasDocuments && (
        <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
          {message.documents?.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {/* Text message bubble */}
      {message.content && (
        <div
          className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed tracking-tight ${
            isUser
              ? 'rounded-br-xs bg-[var(--color-primary)] text-white shadow-xs whitespace-pre-wrap'
              : message.status === 'error'
                ? 'rounded-bl-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 whitespace-pre-wrap'
                : 'rounded-bl-xs bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-2xs'
          }`}
        >
          {isUser ? (
            message.content
          ) : (
            <div className="markdown-body space-y-2.5">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-[var(--color-ink)]">{children}</strong>,
                  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1 pl-1 leading-relaxed">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1 pl-1 leading-relaxed">{children}</ol>,
                  li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
                  h1: ({ children }) => <h1 className="mt-3 mb-1 text-lg font-bold tracking-tight text-[var(--color-ink)]">{children}</h1>,
                  h2: ({ children }) => <h2 className="mt-2.5 mb-1 text-base font-bold tracking-tight text-[var(--color-ink)]">{children}</h2>,
                  h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-bold tracking-tight text-[var(--color-ink)]">{children}</h3>,
                  code: ({ children }) => (
                    <code className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[13px] font-mono font-medium">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TypingBubble({ content }: { content: string }) {
  return (
    <div className="message-in flex justify-start">
      <div className="max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-bl-xs bg-[var(--color-canvas)] px-4 py-3 text-[15px] leading-relaxed tracking-tight text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-2xs">
        {content ? (
          <div className="markdown-body space-y-2.5">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-[var(--color-ink)]">{children}</strong>,
                ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1 pl-1 leading-relaxed">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1 pl-1 leading-relaxed">{children}</ol>,
                li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="mt-3 mb-1 text-lg font-bold tracking-tight text-[var(--color-ink)]">{children}</h1>,
                h2: ({ children }) => <h2 className="mt-2.5 mb-1 text-base font-bold tracking-tight text-[var(--color-ink)]">{children}</h2>,
                h3: ({ children }) => <h3 className="mt-2 mb-1 text-sm font-bold tracking-tight text-[var(--color-ink)]">{children}</h3>,
                code: ({ children }) => (
                  <code className="rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[13px] font-mono font-medium">
                    {children}
                  </code>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="flex gap-1.5 py-1">
            <span className="typing-dot h-2 w-2 rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '0ms' }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '150ms' }} />
            <span className="typing-dot h-2 w-2 rounded-full bg-[var(--color-primary)]" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  )
}

