import { act, render, screen, within } from '@testing-library/react'
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

  it('opens the add form with the N key, but not while typing', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.keyboard('n')
    const dialog = screen.getByRole('dialog', { name: 'Add application' })
    // Typing "n" inside the form must stay text, not reopen anything.
    await user.type(within(dialog).getByLabelText('Company'), 'Canva')
    expect(within(dialog).getByLabelText('Company')).toHaveValue('Canva')

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await user.keyboard('{Control>}n{/Control}')
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

    const confirm = vi.spyOn(window, 'confirm')
    await user.click(screen.getByText('SEEK'))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('SEEK')).not.toBeInTheDocument()
    expect(confirm).not.toHaveBeenCalled()
    expect(screen.getByRole('status', { name: 'Deleted' })).toHaveTextContent('Deleted SEEK')
  })

  it('brings a deleted application back with Undo', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))

    await user.click(screen.getByText('SEEK'))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(screen.getByText('SEEK')).toBeInTheDocument()
    expect(screen.queryByRole('status', { name: 'Deleted' })).not.toBeInTheDocument()
  })

  it('hides the Undo notice after 8 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))
    await user.click(screen.getByText('SEEK'))
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    act(() => vi.advanceTimersByTime(8000))
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe('App: unknown addresses', () => {
  it('shows a not-found page with a way back to the board', async () => {
    const user = userEvent.setup()
    document.title = 'JobTrackr'
    render(
      <MemoryRouter initialEntries={['/no-such-page']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(document.title).toBe('Page not found · JobTrackr')

    await user.click(screen.getByRole('link', { name: 'Go to your board' }))
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument()
    expect(document.title).toBe('JobTrackr')
  })
})
