import type { ReactNode } from 'react'

type Props = { title: string; description: string; footnote?: string; table: ReactNode; children: ReactNode }

// Shared frame for every chart: a title saying what it answers, the chart, and a table view
// (the chart itself is hidden from screen readers; the table carries the same numbers).
export function ChartCard({ title, description, footnote, table, children }: Props) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted">{description}</p>
      <div className="mt-4">{children}</div>
      {footnote && <p className="mt-2 text-xs text-muted">{footnote}</p>}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">View as table</summary>
        <div className="mt-2 overflow-x-auto">{table}</div>
      </details>
    </section>
  )
}
