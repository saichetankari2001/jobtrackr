import type { Application } from '../types/application'

export type Draft = { subject: string; body: string }
export type DraftResult = { ok: true; draft: Draft } | { ok: false; error: string }

// Talks only to our own /api endpoint. The Matilda API key lives on the server, never here.
export async function requestFollowUpDraft(app: Pick<Application, 'company' | 'title' | 'dateApplied'>): Promise<DraftResult> {
  try {
    const res = await fetch('/api/follow-up', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Only these three fields are sent. Notes and other personal details stay in the browser.
      body: JSON.stringify({ company: app.company, title: app.title, dateApplied: app.dateApplied }),
    })
    const data = await res.json().catch(() => null)
    if (res.ok && data?.subject && data?.body) return { ok: true, draft: data }
    if (res.status === 404) return { ok: false, error: 'AI drafting is not available on this version of the site.' }
    return { ok: false, error: data?.error ?? 'Something went wrong. Try again in a moment.' }
  } catch {
    return { ok: false, error: 'Could not reach the server. Check your connection and try again.' }
  }
}
