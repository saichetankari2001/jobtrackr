import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createApplication } from '../store/applications'
import { ApplicationForm } from './ApplicationForm'

const setup = (props: Partial<Parameters<typeof ApplicationForm>[0]> = {}) => {
  const onSubmit = vi.fn()
  const onCancel = vi.fn()
  render(<ApplicationForm onSubmit={onSubmit} onCancel={onCancel} resumeVersions={['Frontend v3']} {...props} />)
  return { onSubmit, onCancel, user: userEvent.setup() }
}

describe('ApplicationForm', () => {
  it('shows errors and does not submit when required fields are empty', async () => {
    const { onSubmit, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(await screen.findByText('Company is required')).toBeInTheDocument()
    expect(screen.getByText('Job title is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Company')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a job link that is not a URL', async () => {
    const { onSubmit, user } = setup()
    await user.type(screen.getByLabelText('Company'), 'Canva')
    await user.type(screen.getByLabelText('Job title'), 'Frontend Engineer')
    await user.type(screen.getByLabelText(/Job link/), 'not a link')
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(await screen.findByText('Must be a valid link')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits trimmed values with sensible defaults', async () => {
    const { onSubmit, user } = setup()
    await user.type(screen.getByLabelText('Company'), '  Canva  ')
    await user.type(screen.getByLabelText('Job title'), 'Frontend Engineer')
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      company: 'Canva',
      title: 'Frontend Engineer',
      status: 'applied',
      roleType: 'Frontend',
    })
  })

  it('pre-fills values when editing and offers delete', async () => {
    const onDelete = vi.fn()
    const app = createApplication({
      company: 'SEEK', title: 'Junior Developer', jobUrl: '', location: 'Melbourne', roleType: 'Full-stack',
      resumeVersion: 'Full-stack v1', status: 'interview', dateApplied: '2026-11-01', notes: '',
    })
    const { onSubmit, user } = setup({ initial: app, onDelete })

    expect(screen.getByLabelText('Company')).toHaveValue('SEEK')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ company: 'SEEK', status: 'interview' })

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalled()
  })
})
