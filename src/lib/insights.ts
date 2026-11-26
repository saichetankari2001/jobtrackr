import { STATUSES, STATUS_LABELS, type Application, type Status } from '../types/application'
import { daysSince, needsFollowUp, toISODate } from './dates'

// Below this many applications, a percentage is too noisy to trust, so the UI labels it.
export const SMALL_SAMPLE = 3

const wasSent = (a: Application) => a.status !== 'saved'
const gotReply = (a: Application) => a.status === 'interview' || a.status === 'offer' || a.status === 'rejected'
const gotInterview = (a: Application) => a.status === 'interview' || a.status === 'offer'

const ratio = (part: number, whole: number) => (whole === 0 ? 0 : part / whole)

export type Summary = {
  applied: number
  responseRate: number
  interviewRate: number
  followUps: number
  offers: number
}

export const summarize = (apps: Application[], now = new Date()): Summary => {
  const sent = apps.filter(wasSent)
  return {
    applied: sent.length,
    responseRate: ratio(sent.filter(gotReply).length, sent.length),
    interviewRate: ratio(sent.filter(gotInterview).length, sent.length),
    followUps: apps.filter((a) => needsFollowUp(a, now)).length,
    offers: sent.filter((a) => a.status === 'offer').length,
  }
}

export type RateRow = { label: string; total: number; interviews: number; rate: number; smallSample: boolean }

// Interview rate per group (e.g. per resume version), best first.
export const rateBy = (apps: Application[], key: (a: Application) => string): RateRow[] => {
  const groups = new Map<string, Application[]>()
  for (const app of apps.filter(wasSent)) {
    const label = key(app).trim() || 'Not set'
    groups.set(label, [...(groups.get(label) ?? []), app])
  }

  return [...groups.entries()]
    .map(([label, group]) => {
      const interviews = group.filter(gotInterview).length
      return { label, total: group.length, interviews, rate: ratio(interviews, group.length), smallSample: group.length < SMALL_SAMPLE }
    })
    .sort((a, b) => b.rate - a.rate || b.total - a.total || a.label.localeCompare(b.label))
}

export type StatusCount = { status: Status; label: string; count: number }

export const statusCounts = (apps: Application[]): StatusCount[] =>
  STATUSES.map((status) => ({ status, label: STATUS_LABELS[status], count: apps.filter((a) => a.status === status).length }))

export type ReplyTime = { medianDays: number | null; replies: number }

// Median days from applying to the first reply. The median, not the average, so one company that
// took three months doesn't make every company look slow.
export const replyTime = (apps: Application[]): ReplyTime => {
  const days = apps
    .filter((a) => a.repliedAt)
    // daysSince counts whole local calendar days, so the reply's time of day doesn't matter.
    .map((a) => daysSince(a.dateApplied, new Date(a.repliedAt!)))
    .sort((a, b) => a - b)
  if (days.length === 0) return { medianDays: null, replies: 0 }
  const mid = Math.floor(days.length / 2)
  const median = days.length % 2 ? days[mid] : (days[mid - 1] + days[mid]) / 2
  return { medianDays: Math.round(median), replies: days.length }
}

export type WeeklyPace = { thisWeek: number; lastWeek: number }

// Applications sent this calendar week and last, weeks starting on Monday (as in Australia).
export const weeklyPace = (apps: Application[], now = new Date()): WeeklyPace => {
  const sinceMonday = (now.getDay() + 6) % 7 // Monday → 0 … Sunday → 6
  const day = (offset: number) => toISODate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday + offset))
  const [lastStart, thisStart, nextStart] = [day(-7), day(0), day(7)]
  // ISO dates (YYYY-MM-DD) sort as text in date order, so plain string comparison is enough.
  const count = (from: string, to: string) => apps.filter((a) => wasSent(a) && a.dateApplied >= from && a.dateApplied < to).length
  return { thisWeek: count(thisStart, nextStart), lastWeek: count(lastStart, thisStart) }
}

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`
