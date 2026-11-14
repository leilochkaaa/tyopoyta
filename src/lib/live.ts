// Client side of the shared event: keys live in this browser only.
import type { ChallengeCard, Talent } from './types'

export interface LivePerson extends Talent {
  skills: string[]
}

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {
    // private mode: keys live in memory for this visit
  }
}

export const myPerson = () => read<{ code: string; token: string; name: string } | null>('tp-me', null)
export const savePerson = (p: { code: string; token: string; name: string }) => write('tp-me', p)
export const tableKeys = () => read<Record<string, string>>('tp-tables', {})
export const saveTableKey = (id: string, token: string) => write('tp-tables', { ...tableKeys(), [id]: token })

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}
const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const live = {
  state: () => call<{ cards: ChallengeCard[]; people: LivePerson[] }>('/api/live'),
  publish: (card: ChallengeCard) => call<{ id: string; token: string }>('/api/live/cards', json({ card })),
  register: (b: { name: string; skills: string[]; languages: string[]; choices: string[]; checks: string[] }) => call<{ code: string; token: string }>('/api/live/register', json(b)),
  decide: (table: string, code: string, yes: boolean, token: string) => call('/api/live/decide', json({ table, code, yes, token })),
  debrief: (b: { table: string; token: string; answers: string[]; contribution: string; link: string }) => call('/api/live/debrief', json(b)),
  note: (b: { table: string; code: string; token: string; seen: string[]; note: string }) => call('/api/live/notes', json(b)),
  table: (id: string, token: string) =>
    call<{ debriefs: { code: string; answers: string[]; contribution: string; link: string }[]; talentYes: string[]; matches: { code: string; name: string }[] }>(`/api/live/table/${id}`, { headers: { 'x-table-token': token } }),
  me: (token: string) => call<{ code: string; matches: { table: string; note: { seen: string[]; note: string } | null }[] }>('/api/live/me', { headers: { 'x-person-token': token } }),
}
