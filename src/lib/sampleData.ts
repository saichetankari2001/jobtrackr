import { createApplication } from '../store/applications'
import type { Application, ApplicationInput } from '../types/application'
import { toISODate } from './dates'

type Sample = Omit<ApplicationInput, 'dateApplied' | 'jobUrl' | 'notes'> & { daysAgo: number; notes?: string; replyAfter?: number }

// Dates are relative to today, so the board always looks realistic (some cards need a follow-up).
const SAMPLES: Sample[] = [
  { company: 'Atlassian', title: 'Graduate Software Engineer', location: 'Sydney', roleType: 'Graduate', resumeVersion: 'General v2', status: 'saved', daysAgo: 0 },
  { company: 'Xero', title: 'Junior Frontend Developer', location: 'Melbourne', roleType: 'Frontend', resumeVersion: 'Frontend v3', status: 'applied', daysAgo: 3 },
  { company: 'REA Group', title: 'Associate Software Engineer', location: 'Melbourne', roleType: 'Full-stack', resumeVersion: 'Full-stack v1', status: 'applied', daysAgo: 18 },
  { company: 'Canva', title: 'Frontend Engineer, Early Career', location: 'Sydney', roleType: 'Frontend', resumeVersion: 'Frontend v3', status: 'applied', daysAgo: 21 },
  { company: 'SEEK', title: 'Junior Developer', location: 'Melbourne', roleType: 'Full-stack', resumeVersion: 'Full-stack v1', status: 'interview', daysAgo: 9, replyAfter: 4, notes: 'Technical interview booked. Revise React hooks and REST design.' },
  { company: 'Telstra', title: 'Cloud Engineer Graduate', location: 'Melbourne', roleType: 'Cloud / DevOps', resumeVersion: 'Cloud v1', status: 'interview', daysAgo: 12, replyAfter: 6 },
  { company: 'Culture Amp', title: 'Junior Software Engineer', location: 'Remote', roleType: 'Full-stack', resumeVersion: 'Full-stack v1', status: 'offer', daysAgo: 30, replyAfter: 5 },
  { company: 'NAB', title: 'Graduate Technology Analyst', location: 'Melbourne', roleType: 'Graduate', resumeVersion: 'General v2', status: 'rejected', daysAgo: 25, replyAfter: 2, notes: 'Rejected 2 days after applying, likely an automated screen.' },
  { company: 'Envato', title: 'Frontend Developer', location: 'Melbourne', roleType: 'Frontend', resumeVersion: 'General v2', status: 'rejected', daysAgo: 16, replyAfter: 9 },
]

export const sampleApplications = (now = new Date()): Application[] =>
  SAMPLES.map(({ daysAgo, notes = '', replyAfter, ...rest }) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)
    const app = createApplication({ ...rest, notes, jobUrl: '', dateApplied: toISODate(date) }, now.toISOString())
    if (replyAfter === undefined) return app
    // The reply arrived mid-morning, `replyAfter` days after applying.
    const replied = new Date(date.getFullYear(), date.getMonth(), date.getDate() + replyAfter, 10)
    return { ...app, repliedAt: replied.toISOString() }
  })
