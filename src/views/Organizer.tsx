import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Building2, CalendarClock, Check, CheckCircle2, Copy, Dices, Eye, EyeOff, Megaphone, Radar, Scale, TrendingUp, TriangleAlert } from 'lucide-react'
import { useStore } from '../lib/store'
import { EVENT } from '../lib/data'
import { allocate, fairnessAudit, type SeatingResult } from '../lib/seating'
import { OrgCompanies, OrgLogin, readToken } from './OrgCompanies'

// Skills Radar: skills companies ask for vs. strengths the city's job-seeker pool
// has self-described. Aggregates only (groups of 5+), never individuals.
// A gap → prepare people. A surplus → invite the companies that need them.
const SKILLS: { name: string; supply: number; demand: number; gapAction?: string; inviteWho?: string }[] = [
  { name: 'Data & analytics', supply: 31, demand: 18, inviteWho: 'data-heavy SMEs (energy, logistics, retail)' },
  { name: 'Customer communication', supply: 22, demand: 16, inviteWho: 'service & retail employers' },
  { name: 'Programming (Python)', supply: 18, demand: 9, inviteWho: 'software & deep-tech startups' },
  { name: 'Cleaning & hygiene', supply: 14, demand: 12 },
  { name: 'UX & user research', supply: 9, demand: 7 },
  { name: 'Security & safety', supply: 6, demand: 15, gapAction: 'Promote the vartijakortti course' },
  { name: 'Planning & logistics', supply: 5, demand: 8, gapAction: 'Invite Laurea logistics alumni' },
  { name: 'DevOps & build pipelines', supply: 4, demand: 11, gapAction: 'Run a 2-hour CI workshop first' },
]

const TABS = [
  { label: 'Companies', icon: Building2 },
  { label: 'Before the event', icon: Radar },
  { label: 'Event day', icon: CalendarClock },
  { label: 'After the event', icon: TrendingUp },
]

function invite(skill: (typeof SKILLS)[number]) {
  return `Hi! ${skill.supply} job seekers in Espoo have real experience in ${skill.name.toLowerCase()}. Bring one real problem to ${EVENT.place} on ${EVENT.date} and work on it with them for 20 minutes. It’s free and takes 5 minutes to prepare.`
}

export default function OrganizerView() {
  const { cards, talents } = useStore()
  const [token, setToken] = useState<string | null>(readToken)
  const [tab, setTab] = useState(0)
  const [liveCounts, setLiveCounts] = useState<{ people: number; companies: number; matches: number } | null>(null)
  useEffect(() => {
    if (!token) return
    const load = () =>
      fetch('/api/org/live', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then(setLiveCounts)
        .catch(() => {})
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [token])
  const [nudged, setNudged] = useState<string[]>([])
  const [inviteFor, setInviteFor] = useState<string | null>(null)
  const [sent, setSent] = useState<string[]>([])
  const [seating, setSeating] = useState<SeatingResult | null>(null)
  const [audit, setAudit] = useState<ReturnType<typeof fairnessAudit> | null>(null)

  const ready = cards.filter((c) => c.status === 'approved')
  const inviteSkill = SKILLS.find((s) => s.name === inviteFor)

  if (!token) return <OrgLogin onToken={setToken} />

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg font-semibold text-brand">
          {EVENT.date} · {EVENT.place} · 21 days to go
        </p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight md:text-5xl">{EVENT.name}</h1>
        {liveCounts && (
          <p className="mt-3 flex items-center gap-2 text-lg font-semibold">
            <span className="h-2.5 w-2.5 rounded-full bg-mint" /> Live now: {liveCounts.people} people registered, {liveCounts.companies} companies published, {liveCounts.matches} mutual matches
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-3xl bg-ink/6 p-1.5 md:grid-cols-4">
        {TABS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-lg font-bold transition ${tab === i ? 'bg-white text-brand ring-1 ring-ink/8' : 'text-ink/65 hover:text-ink'}`}
          >
            <Icon size={20} className="hidden sm:block" /> {label}
          </button>
        ))}
      </div>

      {tab === 0 && <OrgCompanies token={token} onLogout={() => setToken(null)} />}

      {tab === 1 && (
        <div className="pop space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <section className="card p-6">
              <h2 className="text-2xl font-extrabold">
                {ready.length} of {cards.length} companies ready
              </h2>
              <div className="mt-4 divide-y divide-ink/8">
                {cards.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1 truncate text-lg font-semibold">{c.company}</span>
                    {c.status === 'approved' ? (
                      <span className="chip shrink-0 bg-mint-soft text-mint">
                        <CheckCircle2 size={18} /> Ready
                      </span>
                    ) : (
                      <button className="btn shrink-0 bg-rose-soft px-4 py-2 text-rose" disabled={nudged.includes(c.id)} onClick={() => setNudged([...nudged, c.id])}>
                        <Bell size={18} /> {nudged.includes(c.id) ? 'Reminded' : 'Remind'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-6">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold">
                <Radar size={24} className="text-brand" /> Skills radar
              </h2>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-ink/75">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-6 rounded-full bg-brand" /> Job seekers
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-6 rounded-full bg-berry" /> Company openings
                </span>
              </div>
              <div className="mt-5 space-y-5">
                {SKILLS.map((s) => {
                  const gap = s.supply < s.demand
                  return (
                    <div key={s.name}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-lg font-semibold">{s.name}</span>
                        {gap ? (
                          <span className="chip bg-rose-soft text-rose">
                            <TriangleAlert size={18} /> {s.gapAction}
                          </span>
                        ) : s.inviteWho ? (
                          <button
                            className={`chip ${inviteFor === s.name ? 'bg-brand text-white' : 'bg-brand-soft text-brand hover:bg-brand hover:text-white'}`}
                            onClick={() => {
                              setInviteFor(s.name)
                              setTimeout(() => document.getElementById('invite')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
                            }}
                          >
                            <Megaphone size={18} /> {sent.includes(s.name) ? 'Invited' : 'Invite companies'}
                          </button>
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 overflow-hidden rounded-full bg-ink/6">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${(s.supply / 32) * 100}%` }} />
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-ink/6">
                          <div className="h-full rounded-full bg-berry" style={{ width: `${(s.demand / 32) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="mt-5 text-ink/65">Group counts only. No one is profiled.</p>
            </section>
          </div>

          {inviteSkill && (
            <section id="invite" className="card pop space-y-4 p-6 ring-2 ring-brand">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold">
                <Megaphone size={24} className="text-brand" /> Invite {inviteSkill.inviteWho}
              </h2>
              <p className="rounded-2xl bg-brand-soft p-5 text-lg">{invite(inviteSkill)}</p>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" disabled={sent.includes(inviteSkill.name)} onClick={() => setSent([...sent, inviteSkill.name])}>
                  {sent.includes(inviteSkill.name) ? (
                    <>
                      <Check size={20} /> Sent in Business Espoo newsletter
                    </>
                  ) : (
                    <>
                      Send in Business Espoo newsletter <ArrowRight size={20} />
                    </>
                  )}
                </button>
                <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(invite(inviteSkill))}>
                  <Copy size={20} /> Copy
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {tab === 2 && (
        <div className="pop space-y-6">
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold">Seat lottery</h2>
                <p className="mt-1 text-lg text-ink/75">
                  {talents.length} people, {ready.length} tables, team tasks reshuffle each session. Everyone’s 1st choice comes first.
                </p>
              </div>
              <button className="btn-primary text-lg" onClick={() => setSeating(allocate(cards, talents, Date.now() % 1000))}>
                <Dices size={22} /> {seating ? 'Draw again' : 'Run the lottery'}
              </button>
            </div>
            {seating && (
              <div className="pop mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  [`${Math.round(seating.firstChoiceRate * 100)}%`, 'got their 1st choice'],
                  [`${Math.round(seating.everyoneSeated * 100)}%`, 'have a seat'],
                  [String(Object.values(seating.overflow).reduce((a, b) => a + b, 0)), 'wishes didn’t fit'],
                ].map(([a, b]) => (
                  <div key={b} className="rounded-2xl bg-brand-soft p-5">
                    <div className="font-display text-5xl font-extrabold text-brand">{a}</div>
                    <div className="mt-1 text-lg">{b}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 space-y-3">
              {ready.map((c) => {
                const byRound = Array.from({ length: c.rounds }, (_, r) => seating?.seats.filter((s) => s.table === c.id && s.round === r).length ?? 0)
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-28 truncate font-semibold sm:w-44 sm:text-lg">{c.company}</div>
                    <div className="flex flex-1 gap-2">
                      {byRound.map((n, r) => (
                        <div key={r} className="flex flex-1 gap-0.5">
                          {Array.from({ length: c.seatsPerRound }, (_, i) => (
                            <div key={i} className={`h-6 flex-1 rounded ${i < n ? 'bg-brand' : 'bg-ink/6'} transition-colors`} />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="hidden w-28 text-right sm:block">{seating?.overflow[c.id] ? <span className="font-bold text-rose">+{seating.overflow[c.id]} waiting</span> : null}</div>
                  </div>
                )
              })}
            </div>
            {seating && Object.keys(seating.overflow).length > 0 && (
              <div className="pop mt-5 rounded-2xl bg-berry-soft p-4 text-lg">
                <b>Suggestion:</b> ask{' '}
                {Object.entries(seating.overflow)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([id]) => cards.find((c) => c.id === id)!.company)
                  .join(' and ')}{' '}
                to add a 4th round.
              </div>
            )}
            <div className="mt-6 grid gap-4 text-lg sm:grid-cols-2">
              <div className="rounded-2xl bg-mint-soft p-5">
                <div className="mb-1 flex items-center gap-2 font-bold text-mint">
                  <Eye size={20} /> The lottery sees
                </div>
                A code and the chosen tables
              </div>
              <div className="rounded-2xl bg-rose-soft p-5">
                <div className="mb-1 flex items-center gap-2 font-bold text-rose">
                  <EyeOff size={20} /> It never sees
                </div>
                Name, CV, language, age, origin, photo
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-extrabold">
                  <Scale size={24} className="text-brand" /> Fairness check
                </h2>
                <p className="mt-1 text-lg text-ink/75">500 lottery runs, compared by language group.</p>
              </div>
              <button className="btn-ghost text-lg" onClick={() => setAudit(fairnessAudit(cards, talents))}>
                <Scale size={20} /> Run check
              </button>
            </div>
            {audit && (
              <div className="pop mt-6 grid gap-4 sm:grid-cols-2">
                {audit.map((g) => (
                  <div key={g.group} className="rounded-2xl bg-brand-soft p-5">
                    <div className="text-lg font-semibold">{g.group}</div>
                    <div className="font-display text-5xl font-extrabold text-brand">{Math.round(g.firstChoiceRate * 100)}%</div>
                    <div className="text-lg">got their 1st choice ({g.n} people)</div>
                  </div>
                ))}
                <p className="text-lg text-ink/75 sm:col-span-2">The small gap comes from which tables people picked. The lottery can’t see language.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 3 && (
        <div className="pop space-y-6">
          <section className="card p-6">
            <h2 className="text-2xl font-extrabold">From sign-up to job</h2>
            <p className="mt-1 text-lg text-ink/75">Pilot projection with made-up numbers. Real events fill this in automatically.</p>
            <div className="mt-6 space-y-3">
              {(
                [
                  ['Signed up', 64],
                  ['Sat at a table', 60],
                  ['Both said yes', 31],
                  ['Met again', 27],
                  ['Offer or trial day', 7],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-36 text-lg font-semibold sm:w-48">{label}</div>
                  <div className="h-11 flex-1 overflow-hidden rounded-xl bg-ink/6">
                    <div className="flex h-full items-center rounded-xl bg-brand px-3 text-lg font-bold text-white" style={{ width: `${Math.max(10, (n / 64) * 100)}%` }}>
                      {n}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['36', 'people one team-sprint host meets in an afternoon'],
              ['0', 'CVs a company has to read'],
              ['5 min', 'for a company to prepare'],
              ['0', 'decisions made by AI'],
            ].map(([a, b]) => (
              <div key={b} className="card p-6">
                <div className="font-display text-5xl font-extrabold text-brand">{a}</div>
                <div className="mt-1 text-lg">{b}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
