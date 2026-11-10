import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { serializeBackup } from '../lib/backup'
import { sampleApplications } from '../lib/sampleData'
import { useApplications } from '../store/applications'
import { DataControls } from './DataControls'

const file = (text: string) => new File([text], 'backup.json', { type: 'application/json' })

describe('DataControls', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))

  it('disables export when there is nothing to export', () => {
    render(<DataControls />)
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeDisabled()
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
