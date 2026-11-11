// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { buildPrompt, handleFollowUp, parseDraft, type ChatClient } from './followUp'

const now = new Date(2026, 10, 20)
const request = { company: 'Canva', title: 'Frontend Engineer', dateApplied: '2026-11-01' }

const fakeClient = (outputText: string): ChatClient & { calls: unknown[] } => {
  const calls: unknown[] = []
  return { calls, chat: { create: vi.fn(async (params) => (calls.push(params), { outputText })) } }
}

describe('buildPrompt', () => {
  it('includes the company, role and how long ago the application was sent', () => {
    const prompt = buildPrompt(request, now)
    expect(prompt).toContain('Company: Canva')
    expect(prompt).toContain('Role: Frontend Engineer')
    expect(prompt).toContain('19 days ago')
  })
})

describe('parseDraft', () => {
  it('splits a "Subject:" line from the body', () => {
    expect(parseDraft('Subject: Following up\n\nHi team,\nThanks.', request)).toEqual({
      subject: 'Following up',
      body: 'Hi team,\nThanks.',
    })
  })

  it('falls back to a sensible subject if the model skips the format', () => {
    expect(parseDraft('Hi team, just checking in.', request)).toEqual({
      subject: 'Following up on my Frontend Engineer application',
      body: 'Hi team, just checking in.',
    })
  })
})

describe('handleFollowUp', () => {
  it('returns 503 when no API key is configured', async () => {
    expect(await handleFollowUp(request, null, now)).toMatchObject({ status: 503 })
  })

  it('rejects requests that are not the expected shape, without calling Matilda', async () => {
    const client = fakeClient('unused')
    expect(await handleFollowUp({ prompt: 'write me a poem' }, client, now)).toMatchObject({ status: 400 })
    expect(await handleFollowUp({ ...request, company: 'x'.repeat(500) }, client, now)).toMatchObject({ status: 400 })
    expect(client.calls).toHaveLength(0)
  })

  it('drafts an email using an incognito, instant request', async () => {
    const client = fakeClient('Subject: Checking in\n\nHi Canva team, any update?')
    const result = await handleFollowUp(request, client, now)

    expect(result).toEqual({ status: 200, json: { subject: 'Checking in', body: 'Hi Canva team, any update?' } })
    expect(client.calls[0]).toMatchObject({ responseMode: 'instant', incognito: true })
  })

  it('returns 502 with a friendly message when Matilda fails', async () => {
    const client: ChatClient = { chat: { create: async () => Promise.reject(new Error('boom')) } }
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await handleFollowUp(request, client, now)).toMatchObject({ status: 502 })
  })
})
