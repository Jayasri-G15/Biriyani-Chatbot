import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export function useDocuments(conversationId: string | null) {
  return useQuery({
    queryKey: ['documents', conversationId],
    queryFn: () => (conversationId ? api.listDocuments(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, file }: { conversationId: string; file: File }) =>
      api.uploadDocument(conversationId, file),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['documents', variables.conversationId] })
    },
  })
}

export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, documentId }: { conversationId: string; documentId: string }) =>
      api.deleteDocument(conversationId, documentId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['documents', variables.conversationId] })
    },
  })
}
