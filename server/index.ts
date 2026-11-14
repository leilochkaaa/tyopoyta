import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { DEMO_TALK_I18N, demoTranslate, meaningful, DEMO_CARD, DEMO_QUESTIONS, DEMO_RECAP, DEMO_TALK, DEMO_TRANSLATE } from './demo.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(here, '../.env') })
const outer = dotenv.config({ path: path.resolve(here, '../../.env'), quiet: true })
console.log('[env] variables found in junction/.env:', Object.keys(outer.parsed ?? {}).join(', ') || 'none')
const MODEL = 'claude-opus-5-5'
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY
const client = apiKey ? new Anthropic({ apiKey, authToken: null }) : null
// Gemini is the fallback provider when there is no Anthropic key.
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite'
const hasKey = Boolean(client || GEMINI_KEY)
const provider = client ? MODEL : GEMINI_KEY ? GEMINI_MODEL : 'none'

// Shared guardrails: the AI structures and translates. It never scores, ranks
// or filters people, and never infers protected characteristics.
const GUARDRAILS = `Rules you always follow:
- You help humans describe things. You never score, rank, rate, shortlist or recommend rejecting any person.
- Never infer or mention nationality, ethnicity, age, gender, religion, health or family status.
- Do not penalise language level, accent, career gaps or non-linear careers.
- Use plain English a non-native speaker understands (B1 level).`

const Card = z.object({
  format: z.enum(['sprint', 'team', 'taster']).describe('sprint = 20-min problem solving with the host, 4 seats; team = teams of 4 solve it together, the host watches 3 teams at once; taster = hands-on work sample / role-play for practical jobs'),
  title: z.string().describe('The problem as a punchy one-line question or challenge, max 12 words'),
  problem: z.string().describe('2 sentences: the real situation and why it hurts'),
  atTheTable: z.string().describe('What the participant concretely does in 20 minutes at the table, with what materials'),
  goodLooksLike: z.array(z.string()).describe('3 observable behaviours, not credentials or degrees; include one about working with others'),
  parts: z.array(z.string()).describe('Exactly 4 parts of the task, one per teammate, each "Topic: what to do" in max 8 words'),
  teamResult: z.string().describe('What the team hands over together at the end, one sentence'),
  skills: z.array(z.string()).describe('3-5 skills phrased like ESCO skill labels'),
  mustHaves: z.array(z.string()).describe('Only genuine legal/practical requirements (licences, shifts, location). Empty if none.'),
  languages: z.array(z.string()).describe('Working languages actually needed'),
  host: z.string().describe('Role of the employee who hosts the table'),
  whatYouGet: z.string().describe('What the participant gains from joining even without a job offer'),
  debriefQuestions: z.array(z.string()).describe('Exactly 3 short questions the host asks EVERY participant after the sprint, about how they approached the task (not about their background). Same questions for everyone keeps it fair.'),
})

const IntakeOut = z.object({
  reply: z.string().describe('Your next short message to the company (one question at a time), or a one-line summary when done'),
  done: z.boolean(),
  card: Card.nullable().describe('Filled only when done is true'),
})

const TranslateOut = z.object({
  strengths: z.array(
    z.object({
      plain: z.string().describe('The strength in plain words, starting with a verb'),
      esco_label: z.string().describe('Closest ESCO skill label'),
      evidence_quote: z.string().describe('Exact short quote from the person’s own text that shows this'),
    }),
  ),
  reflection_questions: z.array(z.string()).describe('2 questions that help the person notice transferable skills they did not mention'),
})

const RecapOut = z.object({
  common_ground: z.array(z.string()).describe('2-4 short points about the task and approach that came up from both sides'),
  company_heard: z.string().describe('What the company host said in their own words, condensed neutrally'),
  talent_heard: z.string().describe('What the participant said in their own words, condensed neutrally'),
  open_questions: z.array(z.string()).describe('2-3 practical questions for the next meeting: ones either side raised, otherwise what to clarify about the work itself (scope, data, tools, schedule). Never about the person'),
  suggested_next_step: z.string().describe('One concrete next step, based on the company’s promised follow-up and any booked time'),
})

async function askGemini<T extends z.ZodType>(schema: T, system: string, messages: Anthropic.MessageParam[]): Promise<z.infer<T> | null> {
  try {
    const { $schema: _drop, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY! },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] })),
        generationConfig: { responseMimeType: 'application/json', responseJsonSchema: jsonSchema },
      }),
    })
    // one log line with Google's own message (the key itself is never in it)
    if (!r.ok) throw new Error(`${r.status} ${(await r.text()).replace(/\s+/g, ' ').slice(0, 300)}`)
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
    const parsed = schema.safeParse(JSON.parse(text))
    if (!parsed.success) throw new Error('schema mismatch: ' + parsed.error.message.slice(0, 200))
    return parsed.data
  } catch (err) {
    console.error('[ai] gemini failed, falling back to demo:', err instanceof Error ? err.message : err)
    return null
  }
}

async function ask<T extends z.ZodType>(schema: T, system: string, messages: Anthropic.MessageParam[]): Promise<z.infer<T> | null> {
  if (!client) return GEMINI_KEY ? askGemini(schema, system, messages) : null
  try {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'low', format: zodOutputFormat(schema) },
      system,
      messages,
    })
    if (res.stop_reason === 'refusal') return null
    return res.parsed_output ?? null
  } catch (err) {
    console.error('[ai] falling back to demo:', err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err)
    return null
  }
}

const app = express()
app.use(express.json({ limit: '200kb' }))

// The API spends paid credits, so cap each client at 60 calls a minute.
const hits = new Map<string, { n: number; t: number }>()
app.use('/api', (req, res, next) => {
  const ip = req.ip ?? 'anon'
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > 60_000) hits.set(ip, { n: 1, t: now })
  else if (++h.n > 60) return res.status(429).json({ error: 'Too many requests, wait a minute' })
  if (hits.size > 5000) hits.clear()
  next()
})

// ElevenLabs voice (optional). Without a key the browser's own speech services are used.
const XI_KEY = process.env.ELEVENLABS_API_KEY
const XI_BASE = process.env.ELEVENLABS_BASE_URL ?? 'https://api.elevenlabs.io'
const XI_VOICE = process.env.ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM'
// Zero-retention mode needs an enterprise ElevenLabs plan; switch it on with ELEVENLABS_ZERO_RETENTION=true.
const XI_ZRM = process.env.ELEVENLABS_ZERO_RETENTION === 'true' ? '&enable_logging=false' : ''
const ttsCache = new Map<string, Buffer>() // bounded: oldest entry goes first

app.get('/api/health', (_req, res) => res.json({ ai: hasKey ? 'live' : 'demo', voice: XI_KEY ? 'elevenlabs' : 'browser', orgDemoPassword: !process.env.ORGANIZER_PASSWORD }))

// Speech-to-text: audio arrives in memory, is forwarded once, and is never stored.
app.post('/api/stt', express.raw({ type: () => true, limit: '15mb' }), async (req, res) => {
  if (!XI_KEY) return res.status(501).json({ error: 'no ElevenLabs key' })
  try {
    const form = new FormData()
    form.append('model_id', process.env.ELEVENLABS_STT_MODEL ?? 'scribe_v2')
    const lang = String(req.query.lang ?? '').slice(0, 2)
    if (lang) form.append('language_code', lang)
    const type = req.get('content-type') ?? 'audio/webm'
    const ext = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm'
    form.append('file', new Blob([new Uint8Array(req.body as Buffer)], { type }), `answer.${ext}`)
    const r = await fetch(`${XI_BASE}/v1/speech-to-text?${XI_ZRM.slice(1)}`, { method: 'POST', headers: { 'xi-api-key': XI_KEY }, body: form })
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
    const j = (await r.json()) as { text?: string; language_code?: string }
    res.json({ text: j.text ?? '', language: j.language_code ?? null })
  } catch (err) {
    console.error('[stt]', err)
    res.status(502).json({ error: 'stt failed' })
  }
})

// Text-to-speech for the interviewer's questions (cached: the same questions repeat).
app.post('/api/tts', async (req, res) => {
  if (!XI_KEY) return res.status(501).json({ error: 'no ElevenLabs key' })
  const text = String(req.body?.text ?? '').slice(0, 600)
  const cached = ttsCache.get(text)
  if (cached) return res.type('audio/mpeg').send(cached)
  try {
    const r = await fetch(`${XI_BASE}/v1/text-to-speech/${XI_VOICE}?output_format=mp3_44100_128${XI_ZRM}`, {
      method: 'POST',
      headers: { 'xi-api-key': XI_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_TTS_MODEL ?? 'eleven_flash_v2_5' }),
    })
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
    const buf = Buffer.from(await r.arrayBuffer())
    if (ttsCache.size >= 200) ttsCache.delete(ttsCache.keys().next().value!)
    ttsCache.set(text, buf)
    res.type('audio/mpeg').send(buf)
  } catch (err) {
    console.error('[tts]', err)
    res.status(502).json({ error: 'tts failed' })
  }
})

app.post('/api/intake', async (req, res) => {
  const { company = 'the company', turns: rawTurns } = (req.body ?? {}) as { company?: string; turns?: { role: 'user' | 'assistant'; content: string }[] }
  const turns = (Array.isArray(rawTurns) ? rawTurns : []).filter((t) => (t?.role === 'user' || t?.role === 'assistant') && typeof t.content === 'string')
  const userTurns = turns.filter((t) => t.role === 'user').length
  const system = `You interview a small employer (often no HR team) for a City of Espoo recruitment event called "Live Sprints".
Instead of a job ad, the company brings ONE real, small problem that candidates work on with an employee for 20 minutes.
For practical jobs (security, cleaning, care, hospitality, logistics) it is a "taster": a role-play, a visual task or a short work sample — never a written test.
Company: ${company}.
Ask at most 3 short questions, ONE at a time: (1) what is on fire / what will this person do in the first 90 days, (2) what would a great first week look like or what goes wrong today, (3) anything legally required (licence, shifts, language) — challenge requirements that are habits rather than needs (e.g. "native Finnish" for a role that works in English).
After the company has answered ${userTurns >= 3 ? 'enough — you MUST now set done=true and produce the card' : 'your questions'}, set done=true and produce the Challenge Card. Be concrete and use their words.
${GUARDRAILS}`
  const msgs: Anthropic.MessageParam[] = turns.length
    ? turns.map((t) => ({ role: t.role, content: t.content }))
    : [{ role: 'user', content: 'Hi, we want to join the event.' }]
  if (msgs[0].role === 'assistant') msgs.unshift({ role: 'user', content: 'Hi, we want to join the event.' })

  const out = await ask(IntakeOut, system, msgs)
  if (out) return res.json({ reply: out.reply, card: out.done ? out.card : null, mode: 'live' })
  const done = userTurns >= 3
  res.json({ reply: done ? 'Thanks — here is your draft Challenge Card. Edit anything, then approve.' : DEMO_QUESTIONS[userTurns], card: done ? DEMO_CARD : null, mode: 'demo' })
})

const TalkOut = z.object({
  reply: z.string().describe('Your next short spoken message: a warm reaction (max 1 sentence) + ONE question. When done, a short thank-you.'),
  done: z.boolean(),
  real_answers: z.number().int().describe('How many of the person’s messages so far were real, concrete answers about their experience. Not real: insults, jokes, nonsense, off-topic, or vague claims like "I can do anything" without an example'),
})

app.post('/api/talk', async (req, res) => {
  const { turns: rawTurns, lang: rawLang } = (req.body ?? {}) as { turns?: { role: 'user' | 'assistant'; content: string }[]; lang?: string }
  const turns = (Array.isArray(rawTurns) ? rawTurns : []).filter((t) => (t?.role === 'user' || t?.role === 'assistant') && typeof t.content === 'string')
  const lang = String(rawLang ?? 'en').slice(0, 2)
  // Only real answers move the interview on; nonsense gets a polite "say a bit more".
  const userTurns = turns.filter((t) => t.role === 'user' && meaningful(t.content)).length
  const last = turns.at(-1)
  const retry = last?.role === 'user' && !meaningful(last.content)
  const system = `You are a friendly voice assistant at a City of Espoo recruitment event. You help a job seeker talk about what they have done — no CV needed.
Your words are read aloud, so keep each message under 35 words, simple (B1 level), no lists, no emojis.
Reply in the same language the person speaks (their chosen language code: ${lang}). Ask ONE question at a time, 3 questions in total:
1) something they have done — work, studies, a family business, volunteering, caring for someone, anything;
2) a concrete problem they solved there, step by step;
3) what they are learning now and what work they would enjoy next.
Never ask about nationality, age, family, health, religion or residence status, and never ask for a CV or degree.
If the last answer is empty, nonsense, a joke, does not answer the question, or is vague ("I can do anything"), kindly ask for one concrete example instead and do not move on. If someone says they have never worked, ask about studies, family, hobbies or helping others instead.
Set done=true only in the message right after the person gave a real answer to your third question; then just thank them briefly and ask nothing. Otherwise set done=false.
${GUARDRAILS}`
  const msgs: Anthropic.MessageParam[] = [{ role: 'user', content: '(The person opened the voice interview.)' }, ...turns.map((t) => ({ role: t.role, content: t.content }))]
  if (msgs.length > 1 && msgs[1].role === 'user') msgs.splice(1, 0, { role: 'assistant', content: DEMO_TALK[0] })
  const out = await ask(TalkOut, system, msgs)
  if (out) {
    // The AI also judges whether an answer was real (a long insult passes the word count, not the AI).
    const answered = Math.min(userTurns, out.real_answers)
    const tries = turns.filter((t) => t.role === 'user').length
    const done = !retry && ((out.done && answered >= 3) || tries >= 6)
    return res.json({ reply: out.reply, done, answered: done ? 3 : Math.min(answered, 2), mode: 'live' })
  }
  const lines = DEMO_TALK_I18N[lang] ?? DEMO_TALK_I18N.en
  res.json({ reply: retry ? lines[4] : lines[Math.min(userTurns, 3)], done: !retry && userTurns >= 3, answered: userTurns, mode: 'demo' })
})

app.post('/api/translate', async (req, res) => {
  const text = String((req.body ?? {}).text ?? '').slice(0, 8000)
  const system = `You help a job seeker put their own experience into words employers recognise.
They may write in any language and in imperfect English; answer in English.
Find 4-6 strengths, including transferable ones from non-work life (caring for family, volunteering, running a small shop, military service, studies abroad).
Every strength MUST be backed by an exact quote from their text. If there is no evidence, do not include it. Never exaggerate or invent.
If the text has no real experience in it (nonsense, jokes, a few random words), return an empty strengths list and one reflection question asking for a real example.
The person will edit and approve the result — it is theirs, not an assessment.
${GUARDRAILS}`
  const out = await ask(TranslateOut, system, [{ role: 'user', content: text.slice(0, 6000) }])
  if (out) {
    // A skill stays only if its quote really is in the person's words (no invented evidence).
    const norm = (x: string) => x.toLowerCase().replace(/\s+/g, ' ').trim()
    const inText = (q: string) => q.split(/\.\.\.|…/).map(norm).filter(Boolean).every((piece) => norm(text).includes(piece))
    return res.json({ ...out, strengths: out.strengths.filter((st) => inText(st.evidence_quote)), mode: 'live' })
  }
  // Offline: the scripted persona gets her scripted skills, everyone else gets skills from their own words.
  res.json(/base stations/.test(text) ? DEMO_TRANSLATE : demoTranslate(text))
})

app.post('/api/recap', async (req, res) => {
  const { cardTitle = '', problem = '', companyNote = '', talentNote = '', debrief = '', promise = '', booked = '' } = (req.body ?? {}) as Record<string, string>
  const system = `After a 20-minute sprint at a recruitment event, both sides left a short voice note. Write a neutral recap that BOTH sides will see.
Use only what they said. Do not evaluate the participant, do not judge fit, do not recommend hiring or rejecting.
${GUARDRAILS}`
  const content = [
    `Sprint task: ${cardTitle}`,
    problem && `The company's problem: ${problem}`,
    debrief && `Debrief (same questions for everyone) and the participant's answers:\n${debrief}`,
    `Participant's own note:\n${talentNote}`,
    `Company host's note:\n${companyNote}`,
    promise && `The company promised this next step if both say yes: ${promise}`,
    booked && `Time booked: ${booked}`,
  ]
    .filter(Boolean)
    .join('\n\n')
  const out = await ask(RecapOut, system, [{ role: 'user', content }])
  res.json(out ? { ...out, mode: 'live' } : DEMO_RECAP)
})

// ---- Organisers only: password login + the company pipeline (CRM) ----
const ORG_PASSWORD = process.env.ORGANIZER_PASSWORD ?? 'espoo2026'
if (!process.env.ORGANIZER_PASSWORD) console.warn('[org] ORGANIZER_PASSWORD not set, using the demo password')
const orgTokens = new Set<string>()
const sha = (x: string) => crypto.createHash('sha256').update(x).digest()

app.post('/api/org/login', (req, res) => {
  const ok = crypto.timingSafeEqual(sha(String(req.body?.password ?? '')), sha(ORG_PASSWORD))
  if (!ok) return res.status(401).json({ error: 'Wrong password' })
  const token = crypto.randomBytes(24).toString('hex')
  orgTokens.add(token)
  res.json({ token })
})

const orgOnly: express.RequestHandler = (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!orgTokens.has(token)) return res.status(401).json({ error: 'Organisers only' })
  next()
}

const Prospect = z.object({
  name: z.string().min(1).max(120),
  sector: z.string().max(80).default(''),
  contact: z.string().max(120).default(''),
  email: z.string().max(160).default(''),
  status: z.enum(['Idea', 'Invited', 'Interested', 'Challenge ready', 'Attended', 'Hired someone', 'Not now']).default('Idea'),
  nextStep: z.string().max(200).default(''),
  nextDate: z.string().max(10).default(''),
  notes: z.string().max(2000).default(''),
  source: z.string().max(60).default('Added by hand'),
  roles: z.number().int().min(0).max(999).default(0),
})
type ProspectT = z.infer<typeof Prospect> & { id: string; updatedAt: string }
const ORG_FILE = path.resolve(here, '../data/org-companies.json')
const SEED: ProspectT[] = [
  { id: 'p1', name: 'Virta Grid', sector: 'Energy', contact: 'CTO', email: '', status: 'Challenge ready', nextStep: 'Confirm 2 hosts for the team sprint', nextDate: '2026-11-20', notes: 'Wants data people. Team sprint, in person or online.', source: 'Skills radar', roles: 2, updatedAt: '2026-11-13' },
  { id: 'p2', name: 'Pinewave Games', sector: 'Games', contact: 'Studio lead', email: '', status: 'Interested', nextStep: 'Help them write the challenge card', nextDate: '2026-11-15', notes: 'Draft started, stuck on the task.', source: 'Past event', roles: 1, updatedAt: '2026-11-12' },
  { id: 'p3', name: 'Otso Analytics', sector: 'Retail data', contact: 'Head of data', email: '', status: 'Invited', nextStep: 'Follow up by phone', nextDate: '2026-11-14', notes: 'Got the Skills radar invite (31 data people).', source: 'Skills radar', roles: 3, updatedAt: '2026-11-10' },
  { id: 'p4', name: 'Kaari Logistics', sector: 'Logistics', contact: '', email: '', status: 'Idea', nextStep: 'Find a contact via Business Espoo', nextDate: '', notes: '', source: 'Skills radar', roles: 0, updatedAt: '2026-11-09' },
  { id: 'p5', name: 'Hoiva Labs', sector: 'Health tech', contact: 'Head of product', email: '', status: 'Hired someone', nextStep: '', nextDate: '', notes: 'Hired 1 UX designer after the spring event.', source: 'Past event', roles: 0, updatedAt: '2026-10-30' },
]
const loadProspects = (): ProspectT[] => {
  try {
    return JSON.parse(fs.readFileSync(ORG_FILE, 'utf8'))
  } catch {
    return SEED
  }
}
let prospects = loadProspects()
const saveProspects = () => {
  fs.mkdirSync(path.dirname(ORG_FILE), { recursive: true })
  fs.writeFileSync(ORG_FILE, JSON.stringify(prospects, null, 2))
}

app.get('/api/org/companies', orgOnly, (_req, res) => res.json(prospects))
app.post('/api/org/companies', orgOnly, (req, res) => {
  const p = Prospect.safeParse(req.body)
  if (!p.success) return res.status(400).json({ error: 'Company name is required' })
  const row = { ...p.data, id: crypto.randomUUID(), updatedAt: new Date().toISOString().slice(0, 10) }
  prospects = [row, ...prospects]
  saveProspects()
  res.json(row)
})
app.patch('/api/org/companies/:id', orgOnly, (req, res) => {
  const i = prospects.findIndex((x) => x.id === req.params.id)
  const p = Prospect.partial().safeParse(req.body)
  if (i < 0 || !p.success) return res.status(400).json({ error: 'Bad update' })
  const clean = Object.fromEntries(Object.entries(p.data).filter(([, v]) => v !== undefined))
  prospects[i] = { ...prospects[i], ...clean, updatedAt: new Date().toISOString().slice(0, 10) }
  saveProspects()
  res.json(prospects[i])
})
app.delete('/api/org/companies/:id', orgOnly, (req, res) => {
  prospects = prospects.filter((x) => x.id !== req.params.id)
  saveProspects()
  res.json({ ok: true })
})

if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(here, '../dist')
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const port = Number(process.env.PORT ?? 8787)
app.listen(port, () => console.log(`[api] :${port} — AI ${hasKey ? 'live (' + provider + ')' : 'DEMO mode (no ANTHROPIC_API_KEY or GEMINI_API_KEY)'} · voice ${XI_KEY ? 'ElevenLabs' : 'browser'}`))
