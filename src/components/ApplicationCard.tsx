import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { daysSince, formatAge, needsFollowUp } from '../lib/dates'
import type { Application } from '../types/application'

type Props = { app: Application; isOverlay?: boolean }

// The visual card. Kept separate from the draggable wrapper so the drag overlay can reuse it.
export function CardBody({ app, isOverlay = false }: Props) {
  const followUp = needsFollowUp(app)
  const age = daysSince(app.dateApplied)

  return (
    <article
      className={`rounded-lg border bg-surface p-3 ${
        followUp ? 'border-followup/50' : 'border-line'
      } ${isOverlay ? 'rotate-1 shadow-lg' : ''}`}
    >
      <h3 className="font-display text-[15px] leading-tight font-semibold">{app.company}</h3>
      <p className="mt-0.5 text-sm text-muted">{app.title}</p>

      {(app.location || app.resumeVersion) && (
        <p className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted">
          {app.location && <span>{app.location}</span>}
          {app.resumeVersion && (
            <span className="rounded bg-paper px-1.5 py-0.5 text-ink" title="Resume version sent">
              {app.resumeVersion}
            </span>
          )}
        </p>
      )}

      <p className="mt-3 flex items-center justify-between text-xs">
        <span className={followUp ? 'font-semibold text-followup' : 'text-muted'}>
          {app.status === 'saved' ? `Saved ${formatAge(age)}` : `Applied ${formatAge(age)}`}
        </span>
        {followUp && <span className="rounded-full bg-followup px-2 py-0.5 font-medium text-white">Follow up</span>}
      </p>
    </article>
  )
}

export function ApplicationCard({ app }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab touch-manipulation rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied active:cursor-grabbing ${
        isDragging ? 'opacity-40' : ''
      }`}
      aria-label={`${app.company}, ${app.title}. Press space to move.`}
      {...attributes}
      {...listeners}
    >
      <CardBody app={app} />
    </li>
  )
}
