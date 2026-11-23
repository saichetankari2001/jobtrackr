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

  it('restores a removed application exactly as it was, without duplicating it', () => {
    const app = useApplications.getState().add(input)
    useApplications.getState().remove(app.id)
    useApplications.getState().restore(app)
    useApplications.getState().restore(app)
    expect(useApplications.getState().applications).toEqual([app])
  })

  it('records the first reply once: kept from Interview to Offer, cleared if moved back to Applied', () => {
    const { add, move } = useApplications.getState()
    const app = add(input)
    expect(app.repliedAt).toBeUndefined()

    move(app.id, 'interview')
    const firstReply = useApplications.getState().applications[0].repliedAt
    expect(firstReply).toBeTruthy()

    move(app.id, 'offer')
    expect(useApplications.getState().applications[0].repliedAt).toBe(firstReply)

    move(app.id, 'applied')
    expect(useApplications.getState().applications[0].repliedAt).toBeUndefined()
  })

  it('records the first reply when the status is changed through the edit form too', () => {
    const app = useApplications.getState().add(input)
    useApplications.getState().update(app.id, { ...input, status: 'rejected' })
    expect(useApplications.getState().applications[0].repliedAt).toBeTruthy()
  })
})

