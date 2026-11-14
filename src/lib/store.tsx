import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CARDS, makeTalents } from './data'
import type { ChallengeCard, Talent } from './types'

export type View = 'welcome' | 'company' | 'talent' | 'organizer' | 'trust' | 'evidence'

interface Store {
  view: View
  go: (v: View) => void
  cards: ChallengeCard[]
  upsertCard: (c: ChallengeCard) => void
  talents: Talent[]
  me: Talent
  setMe: (t: Talent) => void
  aiMode: 'live' | 'demo' | '…'
  tour: boolean
  setTour: (on: boolean) => void
}

const Ctx = createContext<Store>(null!)
const VIEWS: View[] = ['welcome', 'company', 'talent', 'organizer', 'trust', 'evidence']
const fromHash = (): View => {
  const h = location.hash.slice(1) as View
  return VIEWS.includes(h) ? h : 'welcome'
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(fromHash)
  const [cards, setCards] = useState(CARDS)
  const crowd = useMemo(() => makeTalents(), [])
  const [me, setMe] = useState<Talent>({ code: 'T-100', choices: [], languages: [], checks: [] })
  const [aiMode, setAiMode] = useState<Store['aiMode']>('…')
  const [tour, setTour] = useState(false)

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((j) => setAiMode(j.ai)).catch(() => setAiMode('demo'))
    const onHash = () => setView(fromHash())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  const value: Store = {
    view,
    go: (v) => {
      location.hash = v
      scrollTo({ top: 0 })
    },
    cards,
    upsertCard: (c) => setCards((cs) => (cs.some((x) => x.id === c.id) ? cs.map((x) => (x.id === c.id ? c : x)) : [...cs, c])),
    talents: me.choices.length ? [me, ...crowd] : crowd,
    me,
    setMe,
    aiMode,
    tour,
    setTour,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

export async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}
