import { describe, expect, it } from 'vitest'
import { createApplication } from '../store/applications'
import type { ApplicationInput } from '../types/application'
import { CSV_COLUMNS, csvCell, csvFileName, toCSV } from './csv'

const input = (overrides: Partial<ApplicationInput> = {}): ApplicationInput => ({
  company: 'Canva', title: 'Frontend Engineer', jobUrl: 'https://canva.com/jobs/1', location: 'Sydney',
  roleType: 'Frontend', resumeVersion: 'Frontend v3', status: 'applied', dateApplied: '2026-11-01', notes: '',
  ...overrides,
})

describe('csvCell', () => {
  it('leaves plain values alone', () => {
    expect(csvCell('Canva')).toBe('Canva')
  })

  it('quotes values containing commas, quotes or new lines, doubling inner quotes', () => {
    expect(csvCell('Sydney, NSW')).toBe('"Sydney, NSW"')
    expect(csvCell('said "hi"')).toBe('"said ""hi"""')
    expect(csvCell('line 1\nline 2')).toBe('"line 1\nline 2"')
  })

  it('neutralises spreadsheet formulas so a cell can never run as code', () => {
    expect(csvCell('=HYPERLINK("http://evil.example")')).toBe('"\'=HYPERLINK(""http://evil.example"")"')
    expect(csvCell('+61 400 000 000')).toBe("'+61 400 000 000")
    expect(csvCell('-1')).toBe("'-1")
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
  })
})

describe('toCSV', () => {
  it('writes a header row, then one row per application in a readable order', () => {
    const csv = toCSV([createApplication(input()), createApplication(input({ company: 'Atlassian', status: 'saved' }))])
    const lines = csv.slice(1).split('\r\n') // skip the byte-order mark

    expect(lines[0]).toBe(CSV_COLUMNS.map((c) => c.label).join(','))
    expect(lines[1]).toBe('Canva,Frontend Engineer,Applied,2026-11-01,Sydney,Frontend,Frontend v3,https://canva.com/jobs/1,')
    expect(lines[2]).toMatch(/^Atlassian,Frontend Engineer,Saved,/)
    expect(lines).toHaveLength(3)
  })

  it('starts with a byte-order mark so Excel reads accented names correctly', () => {
    expect(toCSV([]).charCodeAt(0)).toBe(0xfeff)
  })
})

describe('csvFileName', () => {
  it('includes the local date', () => {
    expect(csvFileName(new Date(2026, 10, 19))).toBe('jobtrackr-2026-11-19.csv')
  })
})
