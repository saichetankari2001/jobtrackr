import type { Status } from '../types/application'

// Tailwind only generates CSS for class names it can find written out in full,
// so we list them here rather than building strings like `bg-${status}`.
export const STATUS_STYLES: Record<Status, { bar: string; dot: string }> = {
  saved: { bar: 'bg-saved', dot: 'bg-saved' },
  applied: { bar: 'bg-applied', dot: 'bg-applied' },
  interview: { bar: 'bg-interview', dot: 'bg-interview' },
  offer: { bar: 'bg-offer', dot: 'bg-offer' },
  rejected: { bar: 'bg-rejected', dot: 'bg-rejected' },
}
