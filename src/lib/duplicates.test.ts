import { describe, expect, it } from 'vitest'
import { createApplication } from '../store/applications'
import type { ApplicationInput } from '../types/application'
import { findDuplicate } from './duplicates'

const input = (overrides: Partial<ApplicationInput> = {}): ApplicationInput => ({
  company: 'Canva', title: 'Frontend Engineer', jobUrl: '', location: 'Sydney', roleType: 'Frontend',
  resumeVersion: '', status: 'applied', dateApplied: '2026-11-01', notes: '', ...overrides,
})

describe('findDuplicate', () => {
  const canva = createApplication(input())
  const seek = createApplication(input({ company: 'SEEK', title: 'Junior Developer', jobUrl: 'https://seek.com.au/job/42' }))
  const apps = [canva, seek]

  it('matches the same company and role, ignoring case, spacing and punctuation', () => {
    expect(findDuplicate(apps, { company: '  canva ', title: 'frontend   engineer.', jobUrl: '' })).toBe(canva)
  })

  it('matches the same job link even when the names differ', () => {
    expect(findDuplicate(apps, { company: 'Seek Ltd', title: 'Graduate', jobUrl: 'https://seek.com.au/job/42' })).toBe(seek)
  })

  it('does not match a different role at the same company', () => {
    expect(findDuplicate(apps, { company: 'Canva', title: 'Backend Engineer', jobUrl: '' })).toBeUndefined()
  })

  it('ignores the application being edited and waits for both names before matching', () => {
    expect(findDuplicate(apps, { company: 'Canva', title: 'Frontend Engineer', jobUrl: '' }, canva.id)).toBeUndefined()
    expect(findDuplicate(apps, { company: 'Canva', title: '', jobUrl: '' })).toBeUndefined()
  })
})
