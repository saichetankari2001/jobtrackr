import { describe, expect, it } from 'vitest'
import { createApplication } from '../store/applications'
import type { ApplicationInput, Status } from '../types/application'
import { rateBy, replyTime, statusCounts, summarize, weeklyPace } from './insights'

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

describe('replyTime', () => {
  // Applied on the 1st, replied the given number of days later (local time).
  const replied = (days: number) => ({
    ...make('interview', { dateApplied: '2026-11-01' }),
    repliedAt: new Date(2026, 10, 1 + days, 15, 30).toISOString(),
  })

  it('gives the median days from applying to the first reply, so one slow company cannot skew it', () => {
    expect(replyTime([replied(2), replied(4), replied(90)])).toEqual({ medianDays: 4, replies: 3 })
    expect(replyTime([replied(3), replied(6)])).toEqual({ medianDays: 5, replies: 2 })
  })

  it('ignores applications with no recorded reply, and returns null when there are none', () => {
    expect(replyTime([make('applied'), make('offer')])).toEqual({ medianDays: null, replies: 0 })
  })
})

describe('weeklyPace', () => {
  const apps = [
    make('applied', { dateApplied: '2026-11-16' }), // Monday: first day of this week
    make('interview', { dateApplied: '2026-11-20' }), // today (Friday)
    make('saved', { dateApplied: '2026-11-18' }), // saved, not sent: never counted
    make('applied', { dateApplied: '2026-11-15' }), // Sunday: last day of last week
    make('rejected', { dateApplied: '2026-11-09' }), // Monday last week
    make('applied', { dateApplied: '2026-11-08' }), // two weeks ago
  ]

  it('counts applications sent this week and last week, with weeks starting on Monday', () => {
    expect(weeklyPace(apps, now)).toEqual({ thisWeek: 2, lastWeek: 2 })
  })

  it('treats Sunday as the end of the week, not the start of a new one', () => {
    expect(weeklyPace(apps, new Date(2026, 10, 22, 23, 30))).toEqual({ thisWeek: 2, lastWeek: 2 })
    expect(weeklyPace(apps, new Date(2026, 10, 23))).toEqual({ thisWeek: 0, lastWeek: 2 })
  })
})
