import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatPercent, SMALL_SAMPLE, type RateRow } from '../../lib/insights'
import { ChartCard } from './ChartCard'

type Props = { title: string; description: string; rows: RateRow[]; groupLabel: string }

const BAR_COLOR = 'var(--color-applied)'
const ROW_HEIGHT = 36

// Horizontal bars: interview rate per group. One series, so one colour and no legend.
export function RateChart({ title, description, rows, groupLabel }: Props) {
  const data = rows.map((r) => ({ ...r, display: `${formatPercent(r.rate)} (${r.interviews} of ${r.total})` }))
  const hasSmall = rows.some((r) => r.smallSample)

  return (
    <ChartCard
      title={title}
      description={description}
      footnote={hasSmall ? `Faded bars have fewer than ${SMALL_SAMPLE} applications, so treat them as early signals.` : undefined}
      table={
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-medium">{groupLabel}</th>
              <th className="py-1 text-right font-medium">Sent</th>
              <th className="py-1 text-right font-medium">Interviews</th>
              <th className="py-1 text-right font-medium">Interview rate</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-line">
                <td className="py-1">
                  {r.label}
                  {r.smallSample && <span className="text-muted"> (small sample)</span>}
                </td>
                <td className="py-1 text-right">{r.total}</td>
                <td className="py-1 text-right">{r.interviews}</td>
                <td className="py-1 text-right">{formatPercent(r.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div style={{ height: data.length * ROW_HEIGHT + 8 }} aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 124, bottom: 4, left: 0 }} barCategoryGap={10}>
            <XAxis type="number" domain={[0, 1]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={112}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-ink)', fontSize: 13 }}
            />
            <Tooltip cursor={{ fill: 'var(--color-paper)' }} content={<RateTooltip />} />
            {/* Rounded only at the data end; the end at the baseline stays square. */}
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} maxBarSize={16} minPointSize={2} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label} fill={BAR_COLOR} fillOpacity={d.smallSample ? 0.4 : 1} />
              ))}
              {/* A fixed label width stops Recharts wrapping "100% (1 of 1)" onto two lines. */}
              <LabelList dataKey="display" position="right" offset={8} fill="var(--color-ink)" fontSize={13} width={116} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

type TooltipProps = { active?: boolean; payload?: { payload: RateRow }[] }

function RateTooltip({ active, payload }: TooltipProps) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{row.label}</p>
      <p className="text-muted">
        {row.interviews} of {row.total} reached interview ({formatPercent(row.rate)})
      </p>
      {row.smallSample && <p className="mt-1 text-xs text-muted">Small sample, an early signal only</p>}
    </div>
  )
}
