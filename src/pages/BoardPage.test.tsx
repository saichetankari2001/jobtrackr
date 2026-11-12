import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useApplications } from '../store/applications'
import { BoardPage } from './BoardPage'

describe('BoardPage', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))

  it('shows an empty state, then the board after loading sample data', async () => {
    render(<BoardPage onAdd={() => {}} onEdit={() => {}} />)
    expect(screen.getByText('No applications yet')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Load sample data' }))

    for (const column of ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']) {
      expect(screen.getByRole('heading', { name: column })).toBeInTheDocument()
    }
    expect(screen.getByText('Canva')).toBeInTheDocument()
  })

  it('flags old applications that still need a follow-up', async () => {
    render(<BoardPage onAdd={() => {}} onEdit={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Load sample data' }))
    // Canva (21 days) and REA Group (18 days) are still in Applied.
    expect(screen.getAllByText('Follow up')).toHaveLength(2)
    expect(screen.getByText('2 need a follow-up')).toBeInTheDocument()
  })

  it('filters cards by company or role as you type', async () => {
    const user = userEvent.setup()
    render(<BoardPage onAdd={() => {}} onEdit={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))

    await user.type(screen.getByRole('searchbox', { name: 'Search applications' }), 'canva')
    expect(screen.getByText('Canva')).toBeInTheDocument()
    expect(screen.queryByText('Atlassian')).not.toBeInTheDocument()
    expect(screen.getByText(/Showing 1 of 9/)).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Search applications' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search applications' }), 'zzz')
    expect(screen.getByText(/No applications match “zzz”/)).toBeInTheDocument()
  })
})
