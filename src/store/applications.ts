import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isReply, type Application, type ApplicationInput, type Status } from '../types/application'

type ApplicationsState = {
  applications: Application[]
  add: (input: ApplicationInput) => Application
  update: (id: string, input: ApplicationInput) => void
  move: (id: string, status: Status) => void
  remove: (id: string) => void
  restore: (app: Application) => void
  replaceAll: (applications: Application[]) => void
}

// `now` is a parameter so tests can control time instead of depending on the real clock.
export const createApplication = (input: ApplicationInput, now = new Date().toISOString()): Application => ({
  ...input,
  id: crypto.randomUUID(),
  createdAt: now,
  updatedAt: now,
  statusChangedAt: now,
})

// The fields that change with the status. The first reply is recorded once and kept from Interview to Offer;
// moving a card back to Saved or Applied means it was a mistake, so the reply date is cleared.
const statusChange = (app: Application, status: Status, now: string): Partial<Application> => {
  if (app.status === status) return {}
  return {
    statusChangedAt: now,
    repliedAt: isReply(status) ? (app.repliedAt ?? now) : undefined,
  }
}

export const useApplications = create<ApplicationsState>()(
  persist(
    (set) => ({
      applications: [],

      add: (input) => {
        const app = createApplication(input)
        set((s) => ({ applications: [app, ...s.applications] }))
        return app
      },

      update: (id, input) =>
        set((s) => ({
          applications: s.applications.map((a) => {
            if (a.id !== id) return a
            const now = new Date().toISOString()
            return { ...a, ...input, updatedAt: now, ...statusChange(a, input.status, now) }
          }),
        })),

      move: (id, status) =>
        set((s) => ({
          applications: s.applications.map((a) => {
            if (a.id !== id || a.status === status) return a
            const now = new Date().toISOString()
            return { ...a, status, updatedAt: now, ...statusChange(a, status, now) }
          }),
        })),

      remove: (id) => set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),

      // Puts a deleted application back unchanged (same id and dates). Ignored if it is already there.
      restore: (app) =>
        set((s) => (s.applications.some((a) => a.id === app.id) ? s : { applications: [app, ...s.applications] })),

      replaceAll: (applications) => set({ applications }),
    }),
    // The localStorage key. `version` lets us migrate old saved data if the shape changes later.
    { name: 'jobtrackr:applications', version: 1 },
  ),
)
