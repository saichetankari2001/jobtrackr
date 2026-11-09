import { zodResolver } from '@hookform/resolvers/zod'
import { useId, type ReactNode } from 'react'
import { useForm, type FieldError } from 'react-hook-form'
import { toISODate } from '../lib/dates'
import {
  ROLE_TYPES,
  STATUSES,
  STATUS_LABELS,
  applicationInputSchema,
  type Application,
  type ApplicationInput,
} from '../types/application'

type Props = {
  initial?: Application
  resumeVersions: string[]
  onSubmit: (input: ApplicationInput) => void
  onCancel: () => void
  onDelete?: () => void
}

const emptyInput = (): ApplicationInput => ({
  company: '',
  title: '',
  jobUrl: '',
  location: '',
  roleType: 'Frontend',
  resumeVersion: '',
  status: 'applied',
  dateApplied: toISODate(new Date()),
  notes: '',
})

const inputClass =
  'mt-1 block w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted/70 focus:border-applied focus:outline-2 focus:outline-applied/30 aria-invalid:border-danger'

export function ApplicationForm({ initial, resumeVersions, onSubmit, onCancel, onDelete }: Props) {
  const isEdit = Boolean(initial)
  const datalistId = useId()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationInput>({
    // The same Zod schema that defines our TypeScript type also validates the form.
    resolver: zodResolver(applicationInputSchema),
    defaultValues: initial ?? emptyInput(),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Company" error={errors.company}>
        {(a11y) => <input {...a11y} {...register('company')} autoFocus className={inputClass} />}
      </Field>

      <Field label="Job title" error={errors.title}>
        {(a11y) => <input {...a11y} {...register('title')} className={inputClass} />}
      </Field>

      <Field label="Job link (optional)" error={errors.jobUrl} wide>
        {(a11y) => (
          <input {...a11y} {...register('jobUrl')} type="url" placeholder="https://www.linkedin.com/jobs/…" className={inputClass} />
        )}
      </Field>

      <Field label="Status" error={errors.status}>
        {(a11y) => (
          <select {...a11y} {...register('status')} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Date applied" error={errors.dateApplied}>
        {(a11y) => <input {...a11y} {...register('dateApplied')} type="date" className={inputClass} />}
      </Field>

      <Field label="Role type" error={errors.roleType}>
        {(a11y) => (
          <select {...a11y} {...register('roleType')} className={inputClass}>
            {ROLE_TYPES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Location" error={errors.location}>
        {(a11y) => <input {...a11y} {...register('location')} placeholder="Melbourne" className={inputClass} />}
      </Field>

      <Field label="Resume version" hint="Use the same name each time so Insights can compare versions." error={errors.resumeVersion} wide>
        {(a11y) => (
          <>
            <input {...a11y} {...register('resumeVersion')} list={datalistId} placeholder="Frontend v3" className={inputClass} />
            <datalist id={datalistId}>
              {resumeVersions.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </>
        )}
      </Field>

      <Field label="Notes" error={errors.notes} wide>
        {(a11y) => (
          <textarea {...a11y} {...register('notes')} rows={3} placeholder="Recruiter name, interview questions, salary range…" className={inputClass} />
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-2 pt-2 sm:col-span-2">
        {isEdit && onDelete && (
          <button type="button" onClick={onDelete} className="rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger">
            Delete
          </button>
        )}
        <button type="button" onClick={onCancel} className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-applied">
          Cancel
        </button>
        <button type="submit" className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-applied">
          {isEdit ? 'Save changes' : 'Add application'}
        </button>
      </div>
    </form>
  )
}

type A11yProps = { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }

// Wires up label, hint and error message to the input so screen readers announce them together.
function Field({
  label,
  hint,
  error,
  wide = false,
  children,
}: {
  label: string
  hint?: string
  error?: FieldError
  wide?: boolean
  children: (a11y: A11yProps) => ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-danger">
          {error.message}
        </p>
      )}
    </div>
  )
}
