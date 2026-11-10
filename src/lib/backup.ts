import { z } from 'zod'
import { applicationInputSchema, type Application } from '../types/application'

// Bump this if the stored shape ever changes, and teach parseBackup to upgrade older files.
const BACKUP_VERSION = 1

const applicationSchema = applicationInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  statusChangedAt: z.iso.datetime(),
})

const backupSchema = z.object({
  app: z.literal('jobtrackr'),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  applications: z.array(z.unknown()),
})

export const serializeBackup = (applications: Application[]) =>
  JSON.stringify({ app: 'jobtrackr', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), applications }, null, 2)

export type ParseResult = { ok: true; applications: Application[] } | { ok: false; error: string }

// Never trust a file from disk: validate every record before it reaches the store.
export const parseBackup = (text: string): ParseResult => {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not a JobTrackr backup (it is not valid JSON).' }
  }

  const backup = backupSchema.safeParse(json)
  if (!backup.success) return { ok: false, error: 'This file is not a JobTrackr backup.' }

  const applications: Application[] = []
  for (const [index, raw] of backup.data.applications.entries()) {
    const parsed = applicationSchema.safeParse(raw)
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path.join('.') || 'unknown field'
      return { ok: false, error: `The backup has a problem in application ${index + 1} (${field}). Nothing was imported.` }
    }
    applications.push(parsed.data)
  }
  return { ok: true, applications }
}

export const mergeApplications = (existing: Application[], incoming: Application[]) => {
  const byId = new Map(existing.map((a) => [a.id, a]))
  let added = 0
  let updated = 0
  for (const app of incoming) {
    if (byId.has(app.id)) updated++
    else added++
    byId.set(app.id, app)
  }
  return { applications: [...byId.values()], added, updated }
}

export const backupFileName = (date = new Date()) => `jobtrackr-backup-${date.toISOString().slice(0, 10)}.json`
