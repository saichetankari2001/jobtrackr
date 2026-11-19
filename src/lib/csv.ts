import { STATUS_LABELS, type Application } from '../types/application'
import { toISODate } from './dates'

// Column order is chosen for reading in a spreadsheet, not the order fields are stored.
export const CSV_COLUMNS: { label: string; value: (app: Application) => string }[] = [
  { label: 'Company', value: (a) => a.company },
  { label: 'Job title', value: (a) => a.title },
  { label: 'Status', value: (a) => STATUS_LABELS[a.status] },
  { label: 'Date applied', value: (a) => a.dateApplied },
  { label: 'Location', value: (a) => a.location },
  { label: 'Role type', value: (a) => a.roleType },
  { label: 'Resume version', value: (a) => a.resumeVersion },
  { label: 'Job link', value: (a) => a.jobUrl },
  { label: 'Notes', value: (a) => a.notes },
]

// Excel and Google Sheets run any cell starting with these characters as a formula ("CSV injection").
const FORMULA_START = /^[=+\-@\t\r]/

export function csvCell(value: string): string {
  // Prefixing an apostrophe makes the spreadsheet show the text instead of running it.
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

export function toCSV(applications: Application[]): string {
  const rows = [
    CSV_COLUMNS.map((c) => c.label),
    ...applications.map((app) => CSV_COLUMNS.map((c) => c.value(app))),
  ]
  // The byte-order mark tells Excel the file is UTF-8; CRLF line endings follow the CSV standard (RFC 4180).
  return '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export const csvFileName = (date = new Date()) => `jobtrackr-${toISODate(date)}.csv`
