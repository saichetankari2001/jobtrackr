import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { CardBody } from '../components/ApplicationCard'
import { BoardColumn } from '../components/BoardColumn'
import { needsFollowUp } from '../lib/dates'
import { sampleApplications } from '../lib/sampleData'
import { useApplications } from '../store/applications'
import { STATUSES, STATUS_LABELS, type Application, type Status } from '../types/application'

type Props = { onAdd: () => void; onEdit: (app: Application) => void }

export function BoardPage({ onAdd, onEdit }: Props) {
  const applications = useApplications((s) => s.applications)
  const move = useApplications((s) => s.move)
  const replaceAll = useApplications((s) => s.replaceAll)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    // Space picks up/drops a card; Enter is reserved for opening the card to edit.
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  )

  // Group applications by status once per change, newest first within each column.
  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(STATUSES.map((s) => [s, [] as Application[]])) as Record<Status, Application[]>
    for (const app of applications) groups[app.status].push(app)
    for (const s of STATUSES) groups[s].sort((a, b) => b.dateApplied.localeCompare(a.dateApplied))
    return groups
  }, [applications])

  const followUpCount = applications.filter((a) => needsFollowUp(a)).length
  const activeApp = applications.find((a) => a.id === activeId)

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id))
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (over) move(String(active.id), over.id as Status)
  }

  if (applications.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">No applications yet</h1>
        <p className="mt-2 text-muted">
          Add the jobs you apply for and JobTrackr will show which ones need a follow-up and which resume gets replies.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-lg bg-ink px-4 py-2 font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
          >
            Add your first application
          </button>
          <button
            type="button"
            onClick={() => replaceAll(sampleApplications())}
            className="rounded-lg border border-line bg-surface px-4 py-2 font-medium hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
          >
            Load sample data
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-semibold">Board</h1>
        <p className="text-sm text-muted" aria-live="polite">
          {applications.length} applications
          {followUpCount > 0 && (
            <>
              {', '}
              <span className="font-semibold text-followup">{followUpCount} need a follow-up</span>
            </>
          )}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
        accessibility={{
          announcements: {
            onDragStart: ({ active }) => `Picked up ${appName(applications, active.id)}.`,
            onDragOver: ({ over }) => (over ? `Over ${STATUS_LABELS[over.id as Status]}.` : ''),
            onDragEnd: ({ active, over }) =>
              over ? `Moved ${appName(applications, active.id)} to ${STATUS_LABELS[over.id as Status]}.` : 'Move cancelled.',
            onDragCancel: () => 'Move cancelled.',
          },
        }}
      >
        {/* Phones: columns scroll sideways and snap. Desktop: all five columns fit side by side. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {STATUSES.map((status) => (
            <BoardColumn key={status} status={status} applications={byStatus[status]} onEdit={onEdit} />
          ))}
        </div>

        <DragOverlay>{activeApp ? <CardBody app={activeApp} isOverlay /> : null}</DragOverlay>
      </DndContext>
    </>
  )
}

const appName = (apps: Application[], id: string | number) => apps.find((a) => a.id === id)?.company ?? 'card'
