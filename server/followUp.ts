import { z } from 'zod'
import { daysSince } from '../src/lib/dates'

// The browser may only send these three short fields. The prompt is built here on the server,
// so the endpoint can't be used as a general-purpose chatbot on our API bill.
export const followUpRequestSchema = z.object({
  company: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(120),
  dateApplied: z.iso.date(),
})

export type FollowUpRequest = z.infer<typeof followUpRequestSchema>
export type Draft = { subject: string; body: string }

// The minimal slice of the Matilda client we use, so tests can pass a fake.
export type ChatClient = {
  chat: {
    create(params: { input: string; responseMode?: 'instant'; incognito?: boolean }): Promise<{ outputText: string }>
  }
}

export const buildPrompt = (req: FollowUpRequest, now = new Date()) =>
  [
    'Write a short, polite follow-up email from a job applicant to a hiring team.',
    '',
    `Role: ${req.title}`,
    `Company: ${req.company}`,
    `Applied: ${daysSince(req.dateApplied, now)} days ago`,
    '',
    'Rules:',
    '- Under 120 words, Australian English, warm and professional, never pushy.',
    '- Restate interest in the role and ask whether there is an update on timing.',
    "- Do not invent anything about the applicant's experience.",
    '- Sign off with [Your name].',
    '- Reply in exactly this format and nothing else:',
    'Subject: <subject line>',
    '',
    '<email body>',
  ].join('\n')

export const parseDraft = (text: string, req: FollowUpRequest): Draft => {
  const match = text.trim().match(/^Subject:\s*(.+?)\s*\n+([\s\S]+)$/i)
  if (match) return { subject: match[1], body: match[2].trim() }
  return { subject: `Following up on my ${req.title} application`, body: text.trim() }
}

type Result = { status: number; json: Draft | { error: string } }

// Framework-agnostic handler: the local dev server uses it now, and an AWS Lambda can wrap it later.
export async function handleFollowUp(body: unknown, client: ChatClient | null, now = new Date()): Promise<Result> {
  if (!client) return { status: 503, json: { error: 'AI drafting is not set up on this server.' } }

  const parsed = followUpRequestSchema.safeParse(body)
  if (!parsed.success) return { status: 400, json: { error: 'Invalid request.' } }

  try {
    // incognito: the draft isn't saved to the account's chat history. instant: a short email needs no deep reasoning.
    const response = await client.chat.create({ input: buildPrompt(parsed.data, now), responseMode: 'instant', incognito: true })
    if (!response.outputText.trim()) throw new Error('Empty response from Matilda')
    return { status: 200, json: parseDraft(response.outputText, parsed.data) }
  } catch (error) {
    console.error('Follow-up draft failed:', error)
    return { status: 502, json: { error: 'Matilda could not draft an email right now. Try again in a moment.' } }
  }
}
