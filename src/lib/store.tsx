import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CARDS, makeTalents } from './data'
import type { ChallengeCard, Talent } from './types'
import { live, myPerson, type LivePerson } from './live'

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
  livePeople: LivePerson[]
  refresh: () => void
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
  const [me, setMe] = useState<Talent>(() => ({ code: myPerson()?.code ?? 'T-100', choices: [], languages: [], checks: [] }))
  const [liveCards, setLiveCards] = useState<ChallengeCard[]>([])
  const [livePeople, setLivePeople] = useState<LivePerson[]>([])
  const [tick, setTick] = useState(0)
  const [aiMode, setAiMode] = useState<Store['aiMode']>('…')
  const [tour, setTour] = useState(false)

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((j) => setAiMode(j.ai)).catch(() => setAiMode('demo'))
    const onHash = () => setView(fromHash())
    // Everyone sees the same event: poll the shared state every few seconds.
    const t = setInterval(() => setTick((x) => x + 1), 4000)
    addEventListener('hashchange', onHash)
    return () => {
      removeEventListener('hashchange', onHash)
      clearInterval(t)
    }
  }, [])

  useEffect(() => {
    live
      .state()
      .then((st) => {
        setLiveCards(st.cards)
        setLivePeople(st.people)
      })
      .catch(() => {})
  }, [tick])

  const allCards = useMemo(
    () => [...cards.map((card) => liveCards.find((liveCard) => liveCard.id === card.id) ?? card), ...liveCards.filter((liveCard) => !cards.some((card) => card.id === liveCard.id))],
    [cards, liveCards],
  )
  const talents = useMemo(() => {
    const real = livePeople.filter((p) => p.code !== me.code)
    const mine = me.choices.length ? [me] : []
    // same order on every device, so the seat lottery gives everyone the same result
    return [...mine, ...real, ...crowd].sort((x, y) => x.code.localeCompare(y.code, 'en', { numeric: true }))
  }, [livePeople, crowd, me])

  const value: Store = {
    view,
    go: (v) => {
      location.hash = v
      scrollTo({ top: 0 })
    },
    cards: allCards,
    upsertCard: (c) => setCards((cs) => (cs.some((x) => x.id === c.id) ? cs.map((x) => (x.id === c.id ? c : x)) : [...cs, c])),
    talents,
    livePeople,
    refresh: () => setTick((x) => x + 1),
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
