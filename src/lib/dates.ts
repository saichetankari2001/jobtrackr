import type { Application } from '../types/application'

export const FOLLOW_UP_AFTER_DAYS = 14
const DAY_MS = 86_400_000

// Parse 'YYYY-MM-DD' as a LOCAL date. `new Date('2026-11-06')` would be treated as UTC midnight,
// which in Melbourne (UTC+11) can be off by a day.
const parseLocalDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const daysSince = (isoDate: string, now = new Date()) =>
  Math.max(0, Math.round((startOfDay(now).getTime() - parseLocalDate(isoDate).getTime()) / DAY_MS))

export const needsFollowUp = (app: Pick<Application, 'status' | 'dateApplied'>, now = new Date()) =>
  app.status === 'applied' && daysSince(app.dateApplied, now) >= FOLLOW_UP_AFTER_DAYS

export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const formatAge = (days: number) => (days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`)
