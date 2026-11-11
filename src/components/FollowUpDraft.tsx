import { useState } from 'react'
import { daysSince, needsFollowUp } from '../lib/dates'
import { requestFollowUpDraft, type Draft } from '../lib/followUpApi'
import type { Application } from '../types/application'

type State =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; draft: Draft; copied: boolean }
  | { kind: 'error'; message: string }

export function FollowUpDraft({ app }: { app: Application }) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const flagged = needsFollowUp(app)

  const draft = async () => {
    setState({ kind: 'loading' })
    const result = await requestFollowUpDraft(app)
    setState(result.ok ? { kind: 'ready', draft: result.draft, copied: false } : { kind: 'error', message: result.error })
  }

  const copy = async (d: Draft) => {
    await navigator.clipboard.writeText(`Subject: ${d.subject}\n\n${d.body}`)
    setState({ kind: 'ready', draft: d, copied: true })
  }

  return (
    <section aria-labelledby="follow-up-heading" className={`mb-5 rounded-lg border p-4 ${flagged ? 'border-followup/40 bg-followup/5' : 'border-line bg-paper/60'}`}>
      <h3 id="follow-up-heading" className="text-sm font-semibold">
        {flagged ? `No reply after ${daysSince(app.dateApplied)} days` : 'Follow-up email'}
      </h3>
      <p className="mt-0.5 text-sm text-muted">
        Matilda drafts a short follow-up from the company, role and date. Your notes are not sent. Review it before you send it.
      </p>

      {state.kind !== 'ready' && (
        <button
          type="button"
          onClick={draft}
          disabled={state.kind === 'loading'}
          className="mt-3 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-ink focus-visible:outline-2 focus-visible:outline-applied disabled:cursor-wait disabled:text-muted"
        >
          {state.kind === 'loading' ? 'Drafting…' : 'Draft follow-up email'}
        </button>
      )}

      <div aria-live="polite">
        {state.kind === 'error' && <p className="mt-2 text-sm font-medium text-danger">{state.message}</p>}

        {state.kind === 'ready' && (
          <div className="mt-3">
            <p className="text-sm">
              <span className="text-muted">Subject: </span>
              <span className="font-medium">{state.draft.subject}</span>
            </p>
            <p className="mt-2 rounded-md border border-line bg-surface p-3 text-sm whitespace-pre-wrap">{state.draft.body}</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => copy(state.draft)}
                className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
              >
                {state.copied ? 'Copied' : 'Copy email'}
              </button>
              <button type="button" onClick={draft} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-applied">
                Draft another
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
