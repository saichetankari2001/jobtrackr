import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { useApplications } from './store/applications'

const renderApp = () =>
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>,
  )

describe('App: add, edit and delete an application', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))

  it('adds an application from the header and shows it on the board', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: /Add application/ }))
    const dialog = screen.getByRole('dialog', { name: 'Add application' })
    await user.type(within(dialog).getByLabelText('Company'), 'Atlassian')
    await user.type(within(dialog).getByLabelText('Job title'), 'Graduate Engineer')
    await user.click(within(dialog).getByRole('button', { name: 'Add application' }))

    const applied = screen.getByRole('region', { name: 'Applied' })
    expect(within(applied).getByText('Atlassian')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('edits a card when clicked, then deletes it', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))

    await user.click(screen.getByText('SEEK'))
    const dialog = screen.getByRole('dialog', { name: 'Edit application' })
    await user.selectOptions(within(dialog).getByLabelText('Status'), 'offer')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))
    expect(within(screen.getByRole('region', { name: 'Offer' })).getByText('SEEK')).toBeInTheDocument()

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(screen.getByText('SEEK'))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('SEEK')).not.toBeInTheDocument()
  })
})
