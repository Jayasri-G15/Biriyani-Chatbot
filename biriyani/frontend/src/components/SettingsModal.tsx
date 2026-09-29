import type { ThemeMode } from '../hooks/useTheme'

interface Props {
  isOpen: boolean
  onClose: () => void
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

export function SettingsModal({ isOpen, onClose, theme, onThemeChange }: Props) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--color-canvas)] border border-[var(--color-hairline)] p-6 shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-hairline)]">
          <h2 id="settings-title" className="text-xl font-semibold text-[var(--color-ink)]">
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close Settings"
            className="rounded-lg p-1.5 text-[var(--color-ink-muted-48)] hover:bg-[var(--color-canvas-parchment)] hover:text-[var(--color-ink)] transition"
          >
            ✕
          </button>
        </div>

        <div className="py-6">
          <label className="block text-sm font-medium text-[var(--color-ink-muted-80)] mb-3">
            Appearance
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onThemeChange('light')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition text-left cursor-pointer ${
                theme === 'light'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/20'
                  : 'border-[var(--color-hairline)] bg-[var(--color-canvas-parchment)] hover:border-[var(--color-ink-muted-48)]'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xl">
                ☀️
              </div>
              <div className="text-center">
                <span className="block text-sm font-medium text-[var(--color-ink)]">Light</span>
                <span className="text-xs text-[var(--color-ink-muted-48)]">Clean & Bright</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onThemeChange('dark')}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition text-left cursor-pointer ${
                theme === 'dark'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-2 ring-[var(--color-primary)]/20'
                  : 'border-[var(--color-hairline)] bg-[var(--color-canvas-parchment)] hover:border-[var(--color-ink-muted-48)]'
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-100 text-xl">
                🌙
              </div>
              <div className="text-center">
                <span className="block text-sm font-medium text-[var(--color-ink)]">Dark</span>
                <span className="text-xs text-[var(--color-ink-muted-48)]">Sleek & High Contrast</span>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-hairline)] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-focus)] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
