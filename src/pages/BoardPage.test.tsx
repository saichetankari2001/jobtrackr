import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useApplications } from '../store/applications'
import { STATUSES, type Status } from '../types/application'
import { BoardPage } from './BoardPage'

// jsdom has no layout, so every element measures 0×0 and dnd-kit can't tell which column a card is over.
// Give each column a 280px-wide slot side by side, and each card a box at the top of its column.
const fakeLayout = () => {
  const box = (left: number, top: number, width: number, height: number) =>
    ({ x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) }) as DOMRect
  const columnLeft = (el: Element | null) => {
    const status = el?.closest('section')?.getAttribute('aria-labelledby')?.replace('col-', '') as Status | undefined
    return status ? STATUSES.indexOf(status) * 300 : 0
  }
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (this.tagName === 'SECTION') return box(columnLeft(this), 0, 280, 600)
    if (this.tagName === 'LI') return box(columnLeft(this), 50, 280, 80)
    // The drag overlay's card starts exactly where the picked-up (focused) card is.
    if (this.tagName === 'ARTICLE' && !this.closest('li')) return box(columnLeft(document.activeElement), 50, 280, 80)
    return box(0, 0, 0, 0)
  })
}

// Space picks up Canva (in Applied), then the arrow keys carry it one column right, over Interview.
const pickUpCanvaAndMoveRight = async (user: ReturnType<typeof userEvent.setup>) => {
  screen.getByRole('button', { name: /^Canva, / }).focus()
  await user.keyboard(' ')
  // "Picked up Canva." is announced first, then replaced by where the card is hovering.
  expect(await screen.findByText('Over Applied.')).toBeInTheDocument()
  // dnd-kit starts listening for arrow keys on a timer just after pickup; wait for it, as a real keypress would.
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
  await user.keyboard('{ArrowRight>12/}') // 12 × 25px = one 300px column
  expect(await screen.findByText('Over Interview.')).toBeInTheDocument()
}

describe('BoardPage', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))
  afterEach(() => vi.restoreAllMocks())

  it('opens a card for editing with Enter', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<BoardPage onAdd={() => {}} onEdit={onEdit} />)
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))

    screen.getByRole('button', { name: /^Canva, / }).focus()
    await user.keyboard('{Enter}')

    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit.mock.calls[0][0]).toMatchObject({ company: 'Canva' })
  })

  it('moves a card to another column with the keyboard and announces it', async () => {
    fakeLayout()
    const user = userEvent.setup()
    render(<BoardPage onAdd={() => {}} onEdit={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))
    const canva = () => useApplications.getState().applications.find((a) => a.company === 'Canva')!
    expect(canva().status).toBe('applied')

    await pickUpCanvaAndMoveRight(user)
    await user.keyboard(' ') // drop

    expect(canva().status).toBe('interview')
    expect(await screen.findByText('Moved Canva to Interview.')).toBeInTheDocument()
  })

  it('leaves the card where it was when a keyboard move is cancelled with Escape', async () => {
    fakeLayout()
    const user = userEvent.setup()
    render(<BoardPage onAdd={() => {}} onEdit={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))

    await pickUpCanvaAndMoveRight(user)
    await user.keyboard('{Escape}')

    expect(useApplications.getState().applications.find((a) => a.company === 'Canva')!.status).toBe('applied')
    expect(await screen.findByText('Move cancelled.')).toBeInTheDocument()
  })

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

  it('shows only applications that need a follow-up when the flag is clicked', async () => {
    const user = userEvent.setup()
    render(<BoardPage onAdd={() => {}} onEdit={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))

    const toggle = screen.getByRole('button', { name: '2 need a follow-up' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Canva')).toBeInTheDocument()
    expect(screen.getByText('REA Group')).toBeInTheDocument()
    expect(screen.queryByText('Atlassian')).not.toBeInTheDocument()
    expect(screen.getByText(/Showing 2 of 9/)).toBeInTheDocument()

    await user.click(toggle)
    expect(screen.getByText('Atlassian')).toBeInTheDocument()
  })

  it('focuses search with "/" and clears it with Escape', async () => {
    const user = userEvent.setup()
    render(<BoardPage onAdd={() => {}} onEdit={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Load sample data' }))
    const box = screen.getByRole('searchbox', { name: 'Search applications' })

    await user.keyboard('/')
    expect(box).toHaveFocus()
    expect(box).toHaveValue('')

    await user.keyboard('canva')
    expect(screen.queryByText('Atlassian')).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(box).toHaveValue('')
    expect(screen.getByText('Atlassian')).toBeInTheDocument()
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
