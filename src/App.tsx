import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ApplicationForm } from './components/ApplicationForm'
import { DataControls } from './components/DataControls'
import { FollowUpDraft } from './components/FollowUpDraft'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { Modal } from './components/Modal'
import { UndoToast } from './components/UndoToast'
import { isShortcut } from './lib/keyboard'
import { BoardPage } from './pages/BoardPage'
import { NotFoundPage } from './pages/NotFoundPage'

// Code splitting: the charting library is large, so Insights is downloaded only when visited.
const InsightsPage = lazy(() => import('./pages/InsightsPage').then((m) => ({ default: m.InsightsPage })))
import { useApplications } from './store/applications'
import type { Application, ApplicationInput } from './types/application'

// What the dialog is doing: closed, adding a new application, or editing an existing one.
type Editing = null | { mode: 'add' } | { mode: 'edit'; app: Application }

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-applied ${
    isActive ? 'bg-ink text-white' : 'text-muted hover:text-ink'
  }`

function App() {
  const [editing, setEditing] = useState<Editing>(null)
  const [deleted, setDeleted] = useState<Application | null>(null)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { applications, add, update, remove, restore } = useApplications()

  // Previously used resume versions, offered as suggestions so names stay consistent.
  const resumeVersions = useMemo(
    () => [...new Set(applications.map((a) => a.resumeVersion).filter(Boolean))].sort(),
    [applications],
  )

  const close = () => setEditing(null)
  const openAdd = () => setEditing({ mode: 'add' })
  const openEdit = (app: Application) => setEditing({ mode: 'edit', app })

  const handleSubmit = (input: ApplicationInput) => {
    if (editing?.mode === 'edit') update(editing.app.id, input)
    else add(input)
    close()
  }

  const handleDelete = () => {
    if (editing?.mode !== 'edit') return
    remove(editing.app.id)
    setDeleted(editing.app)
    close()
  }

  const handleUndo = () => {
    if (deleted) restore(deleted)
    setDeleted(null)
  }

  // "N" opens the add form and "?" lists the shortcuts, on any page,
  // unless a dialog is already open or you're typing.
  const dialogOpen = editing !== null || showShortcuts
  useEffect(() => {
    if (dialogOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (isShortcut(e, 'n')) setEditing({ mode: 'add' })
      else if (isShortcut(e, '?')) setShowShortcuts(true)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogOpen])

  // Stable identity, so the toast's 8-second timer isn't restarted on every render.
  const dismissUndo = useCallback(() => setDeleted(null), [])

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
          <span className="font-display text-xl font-bold tracking-tight">JobTrackr</span>
          <nav className="flex gap-1" aria-label="Main">
            <NavLink to="/" end className={navClass}>
              Board
            </NavLink>
            <NavLink to="/insights" className={navClass}>
              Insights
            </NavLink>
          </nav>
          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            aria-label="Keyboard shortcuts"
            aria-keyshortcuts="?"
            title="Keyboard shortcuts (?)"
            className="ml-auto hidden size-8 place-items-center rounded-full border border-line text-sm font-semibold text-muted hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-applied sm:grid"
          >
            <span aria-hidden>?</span>
          </button>
          <button
            type="button"
            onClick={openAdd}
            aria-label="Add application"
            aria-keyshortcuts="N"
            title="Add application (N)"
            className="ml-auto rounded-lg bg-ink px-3 sm:ml-0 py-1.5 text-sm font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
          >
            <span aria-hidden>+ </span>Add<span className="hidden sm:inline"> application</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<BoardPage onAdd={openAdd} onEdit={openEdit} />} />
          <Route
            path="/insights"
            element={
              <Suspense fallback={<p className="text-muted">Loading insights…</p>}>
                <InsightsPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <DataControls />

      <Modal open={editing !== null} onClose={close} title={editing?.mode === 'edit' ? 'Edit application' : 'Add application'}>
        {editing?.mode === 'edit' && editing.app.status === 'applied' && <FollowUpDraft key={`follow-up-${editing.app.id}`} app={editing.app} />}
        {editing && (
          <ApplicationForm
            // A new key resets the form when switching between different applications.
            key={editing.mode === 'edit' ? editing.app.id : 'new'}
            initial={editing.mode === 'edit' ? editing.app : undefined}
            existing={applications}
            resumeVersions={resumeVersions}
            onSubmit={handleSubmit}
            onCancel={close}
            onDelete={editing.mode === 'edit' ? handleDelete : undefined}
          />
        )}
      </Modal>

      <Modal open={showShortcuts} onClose={() => setShowShortcuts(false)} title="Keyboard shortcuts">
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      </Modal>

      {deleted && (
        // Keyed by id: deleting a second card restarts the timer for the new one.
        <UndoToast key={deleted.id} message={`Deleted ${deleted.company}`} onUndo={handleUndo} onDismiss={dismissUndo} />
      )}
    </div>
  )
}

export default App
