import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseBackup, serializeBackup } from '../lib/backup'
import { sampleApplications } from '../lib/sampleData'
import { useApplications } from '../store/applications'
import { DataControls } from './DataControls'

const file = (text: string) => new File([text], 'backup.json', { type: 'application/json' })

describe('DataControls', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))

  it('disables export when there is nothing to export', () => {
    render(<DataControls />)
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled()
  })

  it('downloads a spreadsheet (CSV) of all applications', async () => {
    useApplications.setState({ applications: sampleApplications() })
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<DataControls />)

    await user.click(screen.getByRole('button', { name: 'Export CSV' }))

    const blob = createUrl.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/csv;charset=utf-8')
    expect(await blob.text()).toContain('Company,Job title,Status')
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/^jobtrackr-\d{4}-\d{2}-\d{2}\.csv$/)
    expect(screen.getByText('Exported 9 applications as CSV.')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('downloads a JSON backup that can be imported again', async () => {
    useApplications.setState({ applications: sampleApplications() })
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<DataControls />)

    await user.click(screen.getByRole('button', { name: 'Export backup' }))

    const blob = createUrl.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
    const restored = parseBackup(await blob.text())
    expect(restored.ok && restored.applications).toEqual(useApplications.getState().applications)
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/^jobtrackr-backup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(screen.getByText('Exported 9 applications.')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('imports a valid backup and reports what changed', async () => {
    const user = userEvent.setup()
    render(<DataControls />)
    await user.upload(screen.getByLabelText('Choose a backup file'), file(serializeBackup(sampleApplications())))

    expect(await screen.findByText('Imported: 9 added, 0 updated.')).toBeInTheDocument()
    expect(useApplications.getState().applications).toHaveLength(9)
  })

  it('shows a clear error and changes nothing for a bad file', async () => {
    const user = userEvent.setup()
    render(<DataControls />)
    await user.upload(screen.getByLabelText('Choose a backup file'), file('{"nope": true}'))

    expect(await screen.findByText('This file is not a JobTrackr backup.')).toBeInTheDocument()
    expect(useApplications.getState().applications).toHaveLength(0)
  })
})
