import type { Application, ApplicationInput } from '../types/application'

type Candidate = Pick<ApplicationInput, 'company' | 'title' | 'jobUrl'>

// "  Frontend   Engineer." and "frontend engineer" should count as the same role.
const normalise = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

/** An existing application for the same job (same company and role, or same job link), if any. */
export function findDuplicate(applications: Application[], candidate: Candidate, ignoreId?: string): Application | undefined {
  const company = normalise(candidate.company)
  const title = normalise(candidate.title)
  const url = candidate.jobUrl.trim()

  return applications.find(
    (app) =>
      app.id !== ignoreId &&
      ((url !== '' && app.jobUrl.trim() === url) ||
        (company !== '' && title !== '' && normalise(app.company) === company && normalise(app.title) === title)),
  )
}
