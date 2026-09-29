import { useState } from 'react'
import type { Conversation } from '../types/chat'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  isLoading: boolean
  isError: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onOpenSettings: () => void
}

export function Sidebar({
  conversations,
  activeId,
  isLoading,
  isError,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onOpenSettings,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')

  const startEditing = (c: Conversation) => {
    setEditingId(c.id)
    setDraftTitle(c.title)
  }

  const commitEditing = () => {
    if (editingId && draftTitle.trim()) {
      onRename(editingId, draftTitle.trim())
    }
    setEditingId(null)
  }

  return (
    <aside className="flex h-full w-full flex-col justify-between border-r border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4 sm:w-72">
      <div className="flex flex-col gap-4 min-h-0 flex-1">
        {/* 1. Bot Name / Branding */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white text-lg font-bold shadow-xs">
            🤖
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
            Biriyani AI
          </span>
        </div>

        {/* 2. New Chat Button */}
        <button
          onClick={onNew}
          className="btn-press flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-[15px] font-medium text-white transition hover:bg-[var(--color-primary-focus)] shadow-xs"
        >
          <span className="text-lg leading-none">+</span> New Chat
        </button>

        {/* 3. Chat History */}
        <div className="flex-1 overflow-y-auto pr-1">
          <h3 className="px-2 pb-2 text-xs font-semibold text-[var(--color-ink-muted-48)] uppercase tracking-wider">
            Chat History
          </h3>
          {isLoading && <p className="p-3 text-[14px] text-[var(--color-ink-muted-48)]">Loading conversations…</p>}
          {isError && <p className="p-3 text-[14px] text-red-600">Couldn't load conversations.</p>}
          {!isLoading && !isError && conversations.length === 0 && (
            <p className="p-3 text-[14px] text-[var(--color-ink-muted-48)]">No conversations yet — start one!</p>
          )}

          <ul className="flex flex-col gap-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <div
                  onClick={() => onSelect(c.id)}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[14px] transition ${
                    c.id === activeId
                      ? 'bg-[var(--color-canvas-parchment)] font-medium text-[var(--color-ink)] shadow-xs'
                      : 'text-[var(--color-ink-muted-80)] hover:bg-[var(--color-canvas-parchment)]/70'
                  }`}
                >
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onBlur={commitEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditing()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas)] px-2 py-1 text-[14px] text-[var(--color-ink)] outline-none ring-2 ring-[var(--color-primary-focus)]"
                    />
                  ) : (
                    <span className="truncate">{c.title}</span>
                  )}

                  <div className="ml-2 hidden shrink-0 gap-1 group-hover:flex">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(c)
                      }}
                      className="rounded p-1 text-[var(--color-ink-muted-48)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--color-ink)]"
                      title="Rename"
                    >
                      ✎
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(c.id)
                      }}
                      className="rounded p-1 text-[var(--color-ink-muted-48)] hover:bg-red-500/10 hover:text-red-500"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. Profile Area & Settings at bottom-left */}
      <div className="pt-3 border-t border-[var(--color-hairline)] mt-2">
        <div className="flex items-center justify-between rounded-xl p-2 hover:bg-[var(--color-canvas-parchment)] transition">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold">
              J
            </div>
            <div className="truncate">
              <span className="block text-sm font-medium text-[var(--color-ink)] truncate">
                Jayasri
              </span>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-[var(--color-ink-muted-48)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--color-ink)] transition"
            title="Settings"
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </aside>
  )
}
