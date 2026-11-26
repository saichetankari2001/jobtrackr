// One list, so the help dialog can't drift out of step with what the keys do.
const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ['N'], action: 'Add an application' },
  { keys: ['/'], action: 'Search the board' },
  { keys: ['Esc'], action: 'Clear search, or close a dialog' },
  { keys: ['Space'], action: 'Pick up or drop a card, then move it with the arrow keys' },
  { keys: ['Enter'], action: 'Open a card to edit it' },
  { keys: ['?'], action: 'Show this list' },
]

export function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  return (
    <>
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3 text-sm">
        {SHORTCUTS.map(({ keys, action }) => (
          <div key={action} className="contents">
            <dt className="justify-self-end">
              {keys.map((k) => (
                <kbd key={k} className="rounded-md border border-line bg-paper px-2 py-0.5 font-sans text-xs font-semibold shadow-[0_1px_0_var(--color-line)]">
                  {k}
                </kbd>
              ))}
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted">Single-key shortcuts are ignored while you're typing in a field.</p>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
        >
          Close
        </button>
      </div>
    </>
  )
}
