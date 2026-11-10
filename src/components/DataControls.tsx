import { useRef, useState, type ChangeEvent } from 'react'
import { backupFileName, mergeApplications, parseBackup, serializeBackup } from '../lib/backup'
import { useApplications } from '../store/applications'

type Message = { tone: 'ok' | 'error'; text: string } | null

const buttonClass =
  'rounded-md px-2.5 py-1 font-medium text-ink hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-applied disabled:text-muted disabled:hover:bg-transparent'

export function DataControls() {
  const { applications, replaceAll } = useApplications()
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message>(null)

  const handleExport = () => {
    // Build the file in memory and trigger a download; nothing leaves the browser.
    const blob = new Blob([serializeBackup(applications)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = Object.assign(document.createElement('a'), { href: url, download: backupFileName() })
    link.click()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: `Exported ${applications.length} applications.` })
  }

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again later
    if (!file) return

    const result = parseBackup(await file.text())
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }
    const merged = mergeApplications(applications, result.applications)
    replaceAll(merged.applications)
    setMessage({ tone: 'ok', text: `Imported: ${merged.added} added, ${merged.updated} updated.` })
  }

  return (
    <footer className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-4 text-sm text-muted">
      <p>Your applications are saved in this browser only.</p>
      <div className="flex gap-1">
        <button type="button" onClick={handleExport} disabled={applications.length === 0} className={buttonClass}>
          Export backup
        </button>
        <button type="button" onClick={() => fileInput.current?.click()} className={buttonClass}>
          Import backup
        </button>
        <input ref={fileInput} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" aria-label="Choose a backup file" />
      </div>
      <p role="status" className={message?.tone === 'error' ? 'font-medium text-danger' : ''}>
        {message?.text}
      </p>
    </footer>
  )
}
