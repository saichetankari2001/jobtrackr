import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApplication } from '../store/applications'
import { FollowUpDraft } from './FollowUpDraft'

const app = createApplication({
  company: 'Canva', title: 'Frontend Engineer', jobUrl: '', location: 'Sydney', roleType: 'Frontend',
  resumeVersion: 'Frontend v3', status: 'applied', dateApplied: '2026-11-01', notes: 'Private: salary expectation 80k',
})

const mockFetch = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))

describe('FollowUpDraft', () => {
  afterEach(() => vi.restoreAllMocks())

  it('drafts an email, sending only company, title and date (never notes)', async () => {
    const fetchSpy = mockFetch(200, { subject: 'Checking in', body: 'Hi Canva team, any update?' })
    const user = userEvent.setup()
    render(<FollowUpDraft app={app} />)

    await user.click(screen.getByRole('button', { name: 'Draft follow-up email' }))

    expect(await screen.findByText('Checking in')).toBeInTheDocument()
    expect(screen.getByText('Hi Canva team, any update?')).toBeInTheDocument()
    const sent = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string)
    expect(sent).toEqual({ company: 'Canva', title: 'Frontend Engineer', dateApplied: '2026-11-01' })
  })

  it('copies the subject and body to the clipboard', async () => {
    mockFetch(200, { subject: 'Checking in', body: 'Hi team' })
    const user = userEvent.setup()
    render(<FollowUpDraft app={app} />)
    await user.click(screen.getByRole('button', { name: 'Draft follow-up email' }))
    await user.click(await screen.findByRole('button', { name: 'Copy email' }))

    expect(await navigator.clipboard.readText()).toBe('Subject: Checking in\n\nHi team')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('shows the server error message when drafting is not set up', async () => {
    mockFetch(503, { error: 'AI drafting is not set up on this server.' })
    const user = userEvent.setup()
    render(<FollowUpDraft app={app} />)
    await user.click(screen.getByRole('button', { name: 'Draft follow-up email' }))

    expect(await screen.findByText('AI drafting is not set up on this server.')).toBeInTheDocument()
  })

  it('explains when the site has no API (static hosting returns 404)', async () => {
    mockFetch(404, {})
    const user = userEvent.setup()
    render(<FollowUpDraft app={app} />)
    await user.click(screen.getByRole('button', { name: 'Draft follow-up email' }))

    expect(await screen.findByText('AI drafting is not available on this version of the site.')).toBeInTheDocument()
  })
})
