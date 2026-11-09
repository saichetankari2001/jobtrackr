import { STATUSES, STATUS_LABELS, type Application, type Status } from '../types/application'
import { needsFollowUp } from './dates'

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

export const formatPercent = (value: number) => `${Math.round(value * 100)}%`
