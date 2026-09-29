import type { Conversation, DocumentInfo, Message } from '../types/chat'

const BASE = '/api/v1'

class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const err = body?.error
    throw new ApiError(err?.code ?? 'UNKNOWN_ERROR', err?.message ?? 'Something went wrong.')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  listConversations: () => fetch(`${BASE}/conversations`).then((r) => handle<Conversation[]>(r)),

  createConversation: () =>
    fetch(`${BASE}/conversations`, { method: 'POST' }).then((r) => handle<Conversation>(r)),

  renameConversation: (id: string, title: string) =>
    fetch(`${BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }).then((r) => handle<Conversation>(r)),

  deleteConversation: (id: string) =>
    fetch(`${BASE}/conversations/${id}`, { method: 'DELETE' }).then((r) => handle<void>(r)),

  listMessages: (conversationId: string) =>
    fetch(`${BASE}/conversations/${conversationId}/messages`).then((r) => handle<Message[]>(r)),

  listDocuments: (conversationId: string) =>
    fetch(`${BASE}/conversations/${conversationId}/documents`).then((r) => handle<DocumentInfo[]>(r)),

  uploadDocument: (conversationId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${BASE}/conversations/${conversationId}/documents`, {
      method: 'POST',
      body: formData,
    }).then((r) => handle<DocumentInfo>(r))
  },

  deleteDocument: (conversationId: string, documentId: string) =>
    fetch(`${BASE}/conversations/${conversationId}/documents/${documentId}`, { method: 'DELETE' }).then((r) =>
      handle<void>(r),
    ),
}

export { ApiError }

export async function* streamMessage(
  conversationId: string,
  content: string,
  documentIds?: string[],
  signal?: AbortSignal,
): AsyncGenerator<{ type: 'delta'; content: string } | { type: 'error'; message: string } | { type: 'done' }> {
  const res = await fetch(`${BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, document_ids: documentIds ?? [] }),
    signal,
  })


  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null)
    throw new ApiError(body?.error?.code ?? 'UNKNOWN_ERROR', body?.error?.message ?? 'Something went wrong.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trim()
      if (!json) continue
      yield JSON.parse(json)
    }
  }
}
