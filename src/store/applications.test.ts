import { beforeEach, describe, expect, it } from 'vitest'
import { useApplications } from './applications'
import type { ApplicationInput } from '../types/application'

const input: ApplicationInput = {
  company: 'Canva',
  title: 'Junior Frontend Developer',
  jobUrl: '',
  location: 'Sydney',
  roleType: 'Frontend',
  resumeVersion: 'Frontend v1',
  status: 'applied',
  dateApplied: '2026-11-01',
  notes: '',
}

describe('applications store', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))

  it('adds an application with an id and timestamps', () => {
    const app = useApplications.getState().add(input)
    expect(app.id).toBeTruthy()
    expect(app.statusChangedAt).toBe(app.createdAt)
    expect(useApplications.getState().applications).toHaveLength(1)
  })

  it('moves an application to a new status and records when it changed', async () => {
    const app = useApplications.getState().add(input)
    await new Promise((r) => setTimeout(r, 5))
    useApplications.getState().move(app.id, 'interview')
    const moved = useApplications.getState().applications[0]
    expect(moved.status).toBe('interview')
    expect(moved.statusChangedAt > app.statusChangedAt).toBe(true)
  })

  it('keeps statusChangedAt when an edit does not change the status', async () => {
    const app = useApplications.getState().add(input)
    await new Promise((r) => setTimeout(r, 5))
    useApplications.getState().update(app.id, { ...input, notes: 'Recruiter: Priya' })
    expect(useApplications.getState().applications[0].statusChangedAt).toBe(app.statusChangedAt)
  })

  it('removes an application', () => {
    const app = useApplications.getState().add(input)
    useApplications.getState().remove(app.id)
    expect(useApplications.getState().applications).toHaveLength(0)
  })
})
