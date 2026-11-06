import { useDroppable } from '@dnd-kit/core'
import { STATUS_STYLES } from '../lib/statusStyles'
import { STATUS_LABELS, type Application, type Status } from '../types/application'
import { ApplicationCard } from './ApplicationCard'

type Props = { status: Status; applications: Application[] }

export function BoardColumn({ status, applications }: Props) {
  // The column's id IS its status, so on drop we know exactly where the card went.
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const headingId = `col-${status}`

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={`flex w-72 shrink-0 snap-start flex-col rounded-xl p-2 transition-colors md:w-auto md:min-w-0 ${
        isOver ? 'bg-white/70' : 'bg-white/35'
      }`}
    >
      <header className="flex items-center gap-2 px-1.5 pt-1 pb-3">
        <span className={`size-2.5 rounded-full ${STATUS_STYLES[status].dot}`} aria-hidden />
        <h2 id={headingId} className="font-display font-semibold">
          {STATUS_LABELS[status]}
        </h2>
        <span className="ml-auto text-sm text-muted tabular-nums">{applications.length}</span>
      </header>

      <ul className="flex min-h-24 flex-1 flex-col gap-2">
        {applications.map((app) => (
          <ApplicationCard key={app.id} app={app} />
        ))}
      </ul>
    </section>
  )
}
