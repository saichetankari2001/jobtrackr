import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { RateChart } from '../components/charts/RateChart'
import { StatusChart } from '../components/charts/StatusChart'
import { formatPercent, rateBy, statusCounts, summarize } from '../lib/insights'
import { useApplications } from '../store/applications'

export function InsightsPage() {
  const applications = useApplications((s) => s.applications)

  // Recalculate only when the applications change, not on every render.
  const insights = useMemo(
    () => ({
      summary: summarize(applications),
      byResume: rateBy(applications, (a) => a.resumeVersion),
      byRole: rateBy(applications, (a) => a.roleType),
      byStatus: statusCounts(applications),
    }),
    [applications],
  )
  const { summary } = insights

  if (summary.applied === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">No insights yet</h1>
        <p className="mt-2 text-muted">
          Insights appear once you have applications marked as Applied or further along. Add a few on the board first.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-ink px-4 py-2 font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
        >
          Go to board
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Insights</h1>
      <p className="mt-1 text-sm text-muted">Based on {summary.applied} applications you have sent. Saved jobs are not counted.</p>

      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Applications sent" value={String(summary.applied)} />
        <Stat label="Response rate" value={formatPercent(summary.responseRate)} hint="Got any reply: interview, offer or rejection" />
        <Stat label="Interview rate" value={formatPercent(summary.interviewRate)} hint="Now at Interview or Offer" />
        <Stat
          label="Follow-ups due"
          value={String(summary.followUps)}
          hint="Still in Applied after 14 days"
          highlight={summary.followUps > 0}
        />
      </dl>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RateChart
          title="Which resume gets interviews"
          description="Interview rate for each resume version you sent."
          rows={insights.byResume}
          groupLabel="Resume version"
        />
        <RateChart
          title="Which roles reply"
          description="Interview rate for each type of role."
          rows={insights.byRole}
          groupLabel="Role type"
        />
        <StatusChart counts={insights.byStatus} />
      </div>
    </>
  )
}

function Stat({ label, value, hint, highlight = false }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border bg-surface p-4 ${highlight ? 'border-followup/50' : 'border-line'}`}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className={`mt-1 text-xs ${highlight ? 'font-medium text-followup' : 'text-muted'}`}>{hint}</dd>}
    </div>
  )
}
