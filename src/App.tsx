import { useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { ApplicationForm } from './components/ApplicationForm'
import { Modal } from './components/Modal'
import { BoardPage } from './pages/BoardPage'
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
  const { applications, add, update, remove } = useApplications()

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
    if (window.confirm(`Delete ${editing.app.company}? This cannot be undone.`)) {
      remove(editing.app.id)
      close()
    }
  }

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
            onClick={openAdd}
            aria-label="Add application"
            className="ml-auto rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
          >
            <span aria-hidden>+ </span>Add<span className="hidden sm:inline"> application</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<BoardPage onAdd={openAdd} onEdit={openEdit} />} />
          <Route path="/insights" element={<p className="text-muted">Insights are coming in a later step.</p>} />
        </Routes>
      </main>

      <Modal open={editing !== null} onClose={close} title={editing?.mode === 'edit' ? 'Edit application' : 'Add application'}>
        {editing && (
          <ApplicationForm
            // A new key resets the form when switching between different applications.
            key={editing.mode === 'edit' ? editing.app.id : 'new'}
            initial={editing.mode === 'edit' ? editing.app : undefined}
            resumeVersions={resumeVersions}
            onSubmit={handleSubmit}
            onCancel={close}
            onDelete={editing.mode === 'edit' ? handleDelete : undefined}
          />
        )}
      </Modal>
    </div>
  )
}

export default App
