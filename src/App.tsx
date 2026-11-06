import { NavLink, Route, Routes } from 'react-router-dom'
import { BoardPage } from './pages/BoardPage'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-applied ${
    isActive ? 'bg-ink text-white' : 'text-muted hover:text-ink'
  }`

function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <span className="font-display text-xl font-bold tracking-tight">JobTrackr</span>
          <nav className="flex gap-1" aria-label="Main">
            <NavLink to="/" end className={navClass}>
              Board
            </NavLink>
            <NavLink to="/insights" className={navClass}>
              Insights
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<BoardPage />} />
          <Route path="/insights" element={<p className="text-muted">Insights are coming in a later step.</p>} />
        </Routes>
      </main>
    </div>
  )
}

export default App
