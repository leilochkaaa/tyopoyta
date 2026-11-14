// Shared event state: what companies publish, who registers, who says yes.
// Two devices see each other through this. Names stay server-side until a mutual yes.
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type express from 'express'

interface Person {
  code: string
  name: string
  token: string
  skills: string[]
  languages: string[]
  choices: string[]
  checks: string[]
}
interface Decision {
  table: string
  code: string
  side: 'company' | 'talent'
  yes: boolean
}
interface Debrief {
  table: string
  code: string
  answers: string[]
  contribution: string
  link: string
}
interface Note {
  table: string
  code: string
  seen: string[]
  note: string
}
interface State {
  cards: Record<string, unknown>[]
  tableTokens: Record<string, string>
  people: Person[]
  decisions: Decision[]
  debriefs: Debrief[]
  notes: Note[]
}

const str = (x: unknown, max = 500) => String(x ?? '').slice(0, max)
const strs = (x: unknown, n = 12, max = 200) => (Array.isArray(x) ? x.slice(0, n).map((y) => str(y, max)) : [])
const token = () => crypto.randomBytes(18).toString('hex')

export function mountLive(app: express.Express, dataDir: string) {
  const file = path.join(dataDir, 'live.json')
  let s: State = { cards: [], tableTokens: {}, people: [], decisions: [], debriefs: [], notes: [] }
  try {
    s = { ...s, ...JSON.parse(fs.readFileSync(file, 'utf8')) }
  } catch {
    // fresh event
  }
  const save = () => {
    try {
      fs.mkdirSync(dataDir, { recursive: true })
      fs.writeFileSync(file, JSON.stringify(s))
    } catch (err) {
      console.error('[live] could not save', err)
    }
  }
  const person = (t: unknown) => s.people.find((p) => p.token === t)
  const tableOk = (id: string, t: unknown) => Boolean(id && s.tableTokens[id] && s.tableTokens[id] === t)
  const said = (table: string, code: string, side: Decision['side']) => s.decisions.find((d) => d.table === table && d.code === code && d.side === side)?.yes ?? null
  const mutual = (table: string, code: string) => said(table, code, 'company') === true && said(table, code, 'talent') === true

  // Public: published tasks and anonymous registrations (code, choices, skills, languages). No names, no decisions.
  app.get('/api/live', (_req, res) => {
    res.json({
      cards: s.cards,
      people: s.people.map(({ code, choices, languages, skills, checks }) => ({ code, choices, languages, skills, checks })),
    })
  })

  // A company publishes its task and gets a private key for its table.
  app.post('/api/live/cards', (req, res) => {
    const card = req.body?.card
    if (!card || typeof card !== 'object' || !str(card.title)) return res.status(400).json({ error: 'No card' })
    const id = `c-${crypto.randomBytes(4).toString('hex')}`
    const clean = JSON.parse(JSON.stringify(card).slice(0, 20000))
    s.cards.push({ ...clean, id, status: 'approved', live: true })
    s.tableTokens[id] = token()
    save()
    res.json({ id, token: s.tableTokens[id] })
  })

  // A job seeker registers. The name is kept here and only shown on a mutual yes.
  app.post('/api/live/register', (req, res) => {
    const b = req.body ?? {}
    if (!str(b.name, 60).trim()) return res.status(400).json({ error: 'Name needed' })
    const p: Person = {
      code: `T-${200 + s.people.length}`,
      name: str(b.name, 60).trim(),
      token: token(),
      skills: strs(b.skills, 8),
      languages: strs(b.languages, 10, 40),
      choices: strs(b.choices, 3, 40),
      checks: strs(b.checks, 10),
    }
    s.people.push(p)
    save()
    res.json({ code: p.code, token: p.token })
  })

  app.post('/api/live/decide', (req, res) => {
    const { table, code, yes, token: t } = req.body ?? {}
    const side: Decision['side'] | null = tableOk(table, t) ? 'company' : person(t)?.code === code ? 'talent' : null
    if (!side) return res.status(403).json({ error: 'Not your decision' })
    s.decisions = s.decisions.filter((d) => !(d.table === table && d.code === code && d.side === side))
    s.decisions.push({ table: str(table, 40), code: str(code, 12), side, yes: Boolean(yes) })
    save()
    res.json({ ok: true })
  })

  app.post('/api/live/debrief', (req, res) => {
    const { table, token: t } = req.body ?? {}
    const p = person(t)
    if (!p) return res.status(403).json({ error: 'Register first' })
    s.debriefs = s.debriefs.filter((d) => !(d.table === table && d.code === p.code))
    s.debriefs.push({ table: str(table, 40), code: p.code, answers: strs(req.body.answers, 6, 600), contribution: str(req.body.contribution, 600), link: str(req.body.link, 300) })
    save()
    res.json({ ok: true })
  })

  app.post('/api/live/notes', (req, res) => {
    const { table, code, token: t } = req.body ?? {}
    if (!tableOk(table, t)) return res.status(403).json({ error: 'Not your table' })
    s.notes = s.notes.filter((n) => !(n.table === table && n.code === code))
    s.notes.push({ table: str(table, 40), code: str(code, 12), seen: strs(req.body.seen, 6), note: str(req.body.note, 600) })
    save()
    res.json({ ok: true })
  })

  // The host's view of their table: what people wrote (under codes), who said yes, and names only for mutual matches.
  app.get('/api/live/table/:id', (req, res) => {
    const id = req.params.id
    if (!tableOk(id, req.get('x-table-token'))) return res.status(403).json({ error: 'Not your table' })
    const codes = new Set(s.people.filter((p) => p.choices.includes(id)).map((p) => p.code))
    res.json({
      debriefs: s.debriefs.filter((d) => d.table === id).map(({ code, answers, contribution, link }) => ({ code, answers, contribution, link })),
      talentYes: s.decisions.filter((d) => d.table === id && d.side === 'talent' && d.yes).map((d) => d.code),
      matches: [...codes].filter((c) => mutual(id, c)).map((c) => ({ code: c, name: s.people.find((p) => p.code === c)!.name })),
    })
  })

  // A job seeker's view: for each table they said yes to, whether the company said yes too, and the host's note.
  app.get('/api/live/me', (req, res) => {
    const p = person(req.get('x-person-token'))
    if (!p) return res.status(403).json({ error: 'Register first' })
    res.json({
      code: p.code,
      matches: p.choices
        .filter((t) => mutual(t, p.code))
        .map((t) => ({ table: t, note: s.notes.find((n) => n.table === t && n.code === p.code) ?? null })),
    })
  })

  // Organiser numbers for the live event.
  return {
    counts: () => ({ people: s.people.length, companies: s.cards.length, matches: s.decisions.filter((d) => d.side === 'company' && d.yes && mutual(d.table, d.code)).length }),
  }
}
