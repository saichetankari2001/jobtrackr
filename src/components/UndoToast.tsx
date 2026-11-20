import { useEffect } from 'react'

export const UNDO_TIMEOUT_MS = 8000

type Props = { message: string; onUndo: () => void; onDismiss: () => void }

// Shown after a delete. Deleting straight away with a way back is kinder than an "Are you sure?" popup.
export function UndoToast({ message, onUndo, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, UNDO_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-label="Deleted"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center justify-between gap-4 rounded-lg bg-ink px-4 py-3 text-sm text-white shadow-lg"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="rounded-md px-2 py-1 font-semibold text-white underline underline-offset-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
      >
        Undo
      </button>
    </div>
  )
}
