import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Application, ApplicationInput, Status } from '../types/application'

type ApplicationsState = {
  applications: Application[]
  add: (input: ApplicationInput) => Application
  update: (id: string, input: ApplicationInput) => void
  move: (id: string, status: Status) => void
  remove: (id: string) => void
}

// `now` is a parameter so tests can control time instead of depending on the real clock.
export const createApplication = (input: ApplicationInput, now = new Date().toISOString()): Application => ({
  ...input,
  id: crypto.randomUUID(),
  createdAt: now,
  updatedAt: now,
  statusChangedAt: now,
})

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
            return {
              ...a,
              ...input,
              updatedAt: now,
              statusChangedAt: a.status === input.status ? a.statusChangedAt : now,
            }
          }),
        })),

      move: (id, status) =>
        set((s) => ({
          applications: s.applications.map((a) => {
            if (a.id !== id || a.status === status) return a
            const now = new Date().toISOString()
            return { ...a, status, updatedAt: now, statusChangedAt: now }
          }),
        })),

      remove: (id) => set((s) => ({ applications: s.applications.filter((a) => a.id !== id) })),
    }),
    // The localStorage key. `version` lets us migrate old saved data if the shape changes later.
    { name: 'jobtrackr:applications', version: 1 },
  ),
)
