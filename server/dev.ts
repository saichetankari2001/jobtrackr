// Local API server for development. Vite proxies /api/* here (see vite.config.ts).
// On AWS, the same handleFollowUp() will run inside a Lambda function instead.
import Matilda from '@maincode-ai/matilda-client-sdk'
import { createServer } from 'node:http'
import { handleFollowUp } from './followUp'

// Secrets come from .env.local, which is git-ignored and never bundled into the frontend.
try {
  process.loadEnvFile('.env.local')
} catch {
  // No .env.local: the server still runs and replies 503 "not set up".
}

const PORT = 8787
const MAX_BODY_BYTES = 10_000
const RATE_LIMIT = { max: 10, windowMs: 60_000 }

const apiKey = process.env.MATILDA_API_KEY
const client = apiKey ? new Matilda({ baseUrl: process.env.MATILDA_BASE_URL ?? 'https://matilda.com/api', accessToken: apiKey }) : null

let window = { start: Date.now(), count: 0 }
const rateLimited = () => {
  if (Date.now() - window.start > RATE_LIMIT.windowMs) window = { start: Date.now(), count: 0 }
  return ++window.count > RATE_LIMIT.max
}

const server = createServer(async (req, res) => {
  const reply = (status: number, json: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json' })
    res.end(JSON.stringify(json))
  }

  if (req.method !== 'POST' || req.url !== '/api/follow-up') return reply(404, { error: 'Not found.' })
  if (rateLimited()) return reply(429, { error: 'Too many requests. Wait a minute and try again.' })

  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > MAX_BODY_BYTES) return reply(413, { error: 'Request too large.' })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return reply(400, { error: 'Invalid JSON.' })
  }

  const { status, json } = await handleFollowUp(body, client)
  reply(status, json)
})

// 127.0.0.1 only: the dev server is never reachable from other machines on the network.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`API server on http://127.0.0.1:${PORT} (Matilda ${client ? 'configured' : 'NOT configured: add MATILDA_API_KEY to .env.local'})`)
})
