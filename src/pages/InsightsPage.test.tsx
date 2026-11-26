import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { sampleApplications } from '../lib/sampleData'
import { useApplications } from '../store/applications'
import { InsightsPage } from './InsightsPage'

const renderPage = () =>
  render(
    <MemoryRouter>
      <InsightsPage />
    </MemoryRouter>,
  )

describe('InsightsPage', () => {
  beforeEach(() => useApplications.setState({ applications: [] }))

  it('explains what to do when there is no data yet', () => {
    renderPage()
    expect(screen.getByText('No insights yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to board' })).toBeInTheDocument()
  })

  it('shows headline numbers and chart tables from the sample data', () => {
    useApplications.setState({ applications: sampleApplications() })
    renderPage()

    // Sample data: 8 sent (Atlassian is only saved), 5 replies, 3 at interview/offer, 2 follow-ups.
    expect(screen.getByText('Applications sent', { selector: 'dt' }).nextElementSibling).toHaveTextContent('8')
    expect(screen.getByText('Response rate', { selector: 'dt' }).nextElementSibling).toHaveTextContent('63%')
    expect(screen.getByText('Interview rate', { selector: 'dt' }).nextElementSibling).toHaveTextContent('38%')
    expect(screen.getByText('Follow-ups due', { selector: 'dt' }).nextElementSibling).toHaveTextContent('2')
    // Sample replies came 2, 4, 5, 6 and 9 days after applying: the median is 5.
    expect(screen.getByText('Median reply time', { selector: 'dt' }).nextElementSibling).toHaveTextContent('5 days')
    // Sample dates are relative to today, so the exact weekly counts depend on the weekday;
    // weeklyPace itself is tested with fixed dates in insights.test.ts.
    expect(screen.getByText('Applied this week', { selector: 'dt' }).nextElementSibling).toHaveTextContent(/^\d+$/)
    expect(screen.getByText(/^Since Monday\. Last week: \d+$/)).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Which resume gets interviews' })).toBeInTheDocument()
    expect(screen.getAllByRole('table')).toHaveLength(3)
    expect(screen.getAllByText('Full-stack v1').length).toBeGreaterThan(0)
  })
})
