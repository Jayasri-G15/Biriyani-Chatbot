export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface DocumentInfo {
  id: string
  conversation_id: string
  message_id?: string | null
  filename: string
  file_type: string
  file_size: number
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  status: 'complete' | 'error'
  created_at: string
  documents?: DocumentInfo[]
}
