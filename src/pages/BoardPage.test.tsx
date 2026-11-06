import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useApplications } from '../store/applications'
import { BoardPage } from './BoardPage'

describe('BoardPage', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))

  it('shows an empty state, then the board after loading sample data', async () => {
    render(<BoardPage />)
    expect(screen.getByText('No applications yet')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Load sample data' }))

    for (const column of ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']) {
      expect(screen.getByRole('heading', { name: column })).toBeInTheDocument()
    }
    expect(screen.getByText('Canva')).toBeInTheDocument()
  })

  it('flags old applications that still need a follow-up', async () => {
    render(<BoardPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Load sample data' }))
    // Canva (21 days) and REA Group (18 days) are still in Applied.
    expect(screen.getAllByText('Follow up')).toHaveLength(2)
    expect(screen.getByText('2 need a follow-up')).toBeInTheDocument()
  })
})
