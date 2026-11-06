import { describe, expect, it } from 'vitest'
import { daysSince, needsFollowUp, toISODate } from './dates'

const now = new Date(2026, 10, 20, 15, 0) // 20 Nov 2026, 3pm local time

describe('daysSince', () => {
  it('counts whole calendar days from a YYYY-MM-DD date', () => {
    expect(daysSince('2026-11-20', now)).toBe(0)
    expect(daysSince('2026-11-19', now)).toBe(1)
    expect(daysSince('2026-11-06', now)).toBe(14)
  })

  it('never returns a negative number for future dates', () => {
    expect(daysSince('2026-12-01', now)).toBe(0)
  })
})

describe('needsFollowUp', () => {
  it('flags applications still in Applied after 14 days', () => {
    expect(needsFollowUp({ status: 'applied', dateApplied: '2026-11-06' }, now)).toBe(true)
  })

  it('does not flag applications under 14 days old', () => {
    expect(needsFollowUp({ status: 'applied', dateApplied: '2026-11-07' }, now)).toBe(false)
  })

  it('does not flag applications that have moved on', () => {
    expect(needsFollowUp({ status: 'interview', dateApplied: '2026-10-01' }, now)).toBe(false)
    expect(needsFollowUp({ status: 'rejected', dateApplied: '2026-10-01' }, now)).toBe(false)
  })
})

describe('toISODate', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
