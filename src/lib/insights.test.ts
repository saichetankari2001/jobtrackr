import { describe, expect, it } from 'vitest'
import { createApplication } from '../store/applications'
import type { ApplicationInput, Status } from '../types/application'
import { rateBy, statusCounts, summarize } from './insights'

const now = new Date(2026, 10, 20)

const make = (status: Status, overrides: Partial<ApplicationInput> = {}) =>
  createApplication({
    company: 'Co', title: 'Dev', jobUrl: '', location: '', roleType: 'Frontend',
    resumeVersion: 'v1', status, dateApplied: '2026-11-15', notes: '', ...overrides,
  })

describe('summarize', () => {
  it('ignores saved jobs and computes response and interview rates', () => {
    const apps = [
      make('saved'),
      make('applied'),
      make('applied', { dateApplied: '2026-11-01' }), // 19 days: needs follow-up
      make('interview'),
      make('offer'),
      make('rejected'),
    ]
    expect(summarize(apps, now)).toEqual({
      applied: 5,
      responseRate: 0.6, // interview + offer + rejected = 3 of 5
      interviewRate: 0.4, // interview + offer = 2 of 5
      followUps: 1,
      offers: 1,
    })
  })

  it('returns zero rates instead of dividing by zero', () => {
    expect(summarize([make('saved')], now)).toMatchObject({ applied: 0, responseRate: 0, interviewRate: 0 })
  })
})

describe('rateBy', () => {
  it('groups by a field, sorted by interview rate then size, with blanks as "Not set"', () => {
    const apps = [
      make('interview', { resumeVersion: 'Frontend v3' }),
      make('applied', { resumeVersion: 'Frontend v3' }),
      make('rejected', { resumeVersion: 'General v2' }),
      make('rejected', { resumeVersion: 'General v2' }),
      make('rejected', { resumeVersion: 'General v2' }),
      make('applied', { resumeVersion: '' }),
      make('saved', { resumeVersion: 'Ignored' }),
    ]
    const rows = rateBy(apps, (a) => a.resumeVersion)

    expect(rows.map((r) => r.label)).toEqual(['Frontend v3', 'General v2', 'Not set'])
    expect(rows[0]).toMatchObject({ total: 2, interviews: 1, rate: 0.5, smallSample: true })
    expect(rows[1]).toMatchObject({ total: 3, interviews: 0, rate: 0, smallSample: false })
  })
})

describe('statusCounts', () => {
  it('counts every status in board order, including zeros', () => {
    const counts = statusCounts([make('applied'), make('applied'), make('offer')])
    expect(counts).toEqual([
      { status: 'saved', label: 'Saved', count: 0 },
      { status: 'applied', label: 'Applied', count: 2 },
      { status: 'interview', label: 'Interview', count: 0 },
      { status: 'offer', label: 'Offer', count: 1 },
      { status: 'rejected', label: 'Rejected', count: 0 },
    ])
  })
})
