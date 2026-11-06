import { z } from 'zod'

// The columns on the Kanban board, in order.
export const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const
export type Status = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
}

export const ROLE_TYPES = ['Frontend', 'Full-stack', 'Backend', 'Cloud / DevOps', 'Graduate', 'Other'] as const
export type RoleType = (typeof ROLE_TYPES)[number]

// One schema = form validation rules AND the TypeScript type. They can never drift apart.
export const applicationInputSchema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  title: z.string().trim().min(1, 'Job title is required'),
  jobUrl: z.union([z.url('Must be a valid link'), z.literal('')]),
  location: z.string().trim(),
  roleType: z.enum(ROLE_TYPES),
  resumeVersion: z.string().trim(),
  status: z.enum(STATUSES),
  dateApplied: z.iso.date('Pick a date'),
  notes: z.string(),
})

export type ApplicationInput = z.infer<typeof applicationInputSchema>

// What we actually store: the user's input plus fields the app manages itself.
export type Application = ApplicationInput & {
  id: string
  createdAt: string
  updatedAt: string
  // When the status last changed: used for "no reply after 14 days" and response-time stats.
  statusChangedAt: string
}
