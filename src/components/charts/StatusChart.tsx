import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StatusCount } from '../../lib/insights'
import type { Status } from '../../types/application'
import { ChartCard } from './ChartCard'

// Same colours as the board columns, so a status looks the same everywhere in the app.
const STATUS_FILL: Record<Status, string> = {
  saved: 'var(--color-saved)',
  applied: 'var(--color-applied)',
  interview: 'var(--color-interview)',
  offer: 'var(--color-offer)',
  rejected: 'var(--color-rejected)',
}

export function StatusChart({ counts }: { counts: StatusCount[] }) {
  return (
    <ChartCard
      title="Where your applications are now"
      description="Every application by its current column on the board."
      table={
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-medium">Status</th>
              <th className="py-1 text-right font-medium">Applications</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {counts.map((c) => (
              <tr key={c.status} className="border-t border-line">
                <td className="py-1">{c.label}</td>
                <td className="py-1 text-right">{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div style={{ height: counts.length * 36 + 8 }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={counts} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }} barCategoryGap={10}>
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis type="category" dataKey="label" width={112} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-ink)', fontSize: 13 }} />
            <Tooltip
              cursor={{ fill: 'var(--color-paper)' }}
              content={({ active, payload }) => {
                const c = payload?.[0]?.payload as StatusCount | undefined
                if (!active || !c) return null
                return (
                  <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-md">
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted">: {c.count} {c.count === 1 ? 'application' : 'applications'}</span>
                  </div>
                )
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16} minPointSize={2} isAnimationActive={false}>
              {counts.map((c) => (
                <Cell key={c.status} fill={STATUS_FILL[c.status]} />
              ))}
              <LabelList dataKey="count" position="right" offset={8} fill="var(--color-ink)" fontSize={13} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
