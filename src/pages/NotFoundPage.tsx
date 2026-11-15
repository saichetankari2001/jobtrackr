import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  // The browser tab says what happened too; the original title comes back on leaving.
  useEffect(() => {
    const previous = document.title
    document.title = 'Page not found · JobTrackr'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="font-display text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">This address doesn't match any page. Your applications are safe.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-ink px-4 py-2 font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied"
      >
        Go to your board
      </Link>
    </div>
  )
}
