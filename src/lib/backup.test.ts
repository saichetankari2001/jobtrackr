import { describe, expect, it } from 'vitest'
import { createApplication } from '../store/applications'
import type { ApplicationInput } from '../types/application'
import { mergeApplications, parseBackup, serializeBackup } from './backup'

const input: ApplicationInput = {
  company: 'Canva', title: 'Frontend Engineer', jobUrl: '', location: 'Sydney', roleType: 'Frontend',
  resumeVersion: 'Frontend v3', status: 'applied', dateApplied: '2026-11-01', notes: '',
}

describe('backup', () => {
  it('round-trips applications through export and import', () => {
    const apps = [createApplication(input), createApplication({ ...input, company: 'Xero' })]
    const result = parseBackup(serializeBackup(apps))
    expect(result).toEqual({ ok: true, applications: apps })
  })

  it('rejects text that is not JSON', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'This file is not a JobTrackr backup (it is not valid JSON).' })
  })

  it('rejects JSON that is not a JobTrackr backup', () => {
    expect(parseBackup('{"hello": "world"}')).toMatchObject({ ok: false })
  })

  it('rejects a backup containing an invalid application, and says which one', () => {
    const bad = JSON.parse(serializeBackup([createApplication(input)]))
    bad.applications[0].status = 'ghosted'
    const result = parseBackup(JSON.stringify(bad))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('application 1')
  })

  it('merges by id: imported records update matches and new ones are added', () => {
    const existing = createApplication(input)
    const other = createApplication({ ...input, company: 'Xero' })
    const updated = { ...existing, status: 'interview' as const }
    const added = createApplication({ ...input, company: 'SEEK' })

    const { applications, added: addedCount, updated: updatedCount } = mergeApplications([existing, other], [updated, added])

    expect(applications.map((a) => a.company).sort()).toEqual(['Canva', 'SEEK', 'Xero'])
    expect(applications.find((a) => a.id === existing.id)?.status).toBe('interview')
    expect({ addedCount, updatedCount }).toEqual({ addedCount: 1, updatedCount: 1 })
  })
})
