import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, EyeOff, Keyboard, Loader2, Mic, Quote, Sparkles, X } from 'lucide-react'
import { post, useStore } from '../lib/store'
import { EVENT } from '../lib/data'
import { allocate } from '../lib/seating'
import type { ChallengeCard, Strength, TranslateResult } from '../lib/types'
import { fitSkills } from '../lib/fit'
import ChallengeCardView from './ChallengeCardView'
import LiveView from './Live'
import TalkInterview from './TalkInterview'
import { NavBar, StepHeader, Stepper } from './Wizard'

const AMIRA = `I have a master’s in electrical engineering. For 5 years I worked at a telecom operator in Damascus, finding the causes of network outages. I built a Python script that predicted which base stations would fail, so we fixed them before customers called. I led a team of 4 field engineers and explained problems to managers who were not technical. In Finland I finished a data analytics course. I want to work with data or reliability.`

const WORK_LANGS = ['English', 'Finnish', 'Finnish (basic)', 'Swedish', 'Russian', 'Ukrainian', 'Arabic', 'Somali', 'Estonian', 'Spanish']

const FILTERS = {
  all: { label: 'All', test: () => true },
  online: { label: 'Online', test: (c: ChallengeCard) => c.where !== 'onsite' },
  team: { label: 'Team sprints', test: (c: ChallengeCard) => c.format === 'team' },
  taster: { label: 'Hands-on jobs', test: (c: ChallengeCard) => c.format === 'taster' },
}

const STEPS = ['About you', 'Pick tables', 'Confirm', 'Your pass', 'Event day']

export default function TalentView() {
  const { cards, talents, me, setMe } = useStore()
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'talk' | 'write'>('talk')
  const [text, setText] = useState(AMIRA)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<TranslateResult | null>(null)
  const [kept, setKept] = useState<Strength[]>([])
  const [bestFirst, setBestFirst] = useState(true)
  const [langs, setLangs] = useState<string[]>(['English'])
  const [filter, setFilter] = useState<keyof typeof FILTERS>('all')
  const [picks, setPicks] = useState<string[]>(me.choices)
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  const open = cards.filter((c) => c.status === 'approved')
  const demand = useMemo(() => {
    const d: Record<string, number> = {}
    talents.forEach((t) => t.choices.forEach((c) => (d[c] = (d[c] ?? 0) + 1)))
    return d
  }, [talents])

  async function translate(input = text) {
    setBusy(true)
    try {
      const r = await post<TranslateResult>('/api/translate', { text: input })
      setResult(r)
      setKept(r.strengths)
    } catch {
      alert('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id: string) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p))
  const needed = picks.flatMap((id) => cards.find((c) => c.id === id)!.mustHaves.map((m) => ({ key: `${id}:${m}`, m, company: cards.find((c) => c.id === id)!.company })))
  const schedule = useMemo(() => {
    if (step < 3) return []
    return allocate(cards, talents).seats.filter((s) => s.talent === me.code).sort((a, b) => a.round - b.round)
  }, [step, cards, talents, me.code])

  const liveTable = picks.includes('kvanttia') ? 'kvanttia' : (picks[0] ?? 'kvanttia')

  const go = (i: number) => {
    setStep(i)
    scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-8">
      <Stepper steps={STEPS} current={step} onJump={go} />

      {step === 0 && (
        <>
          <StepHeader eyebrow="Step 1 · About you" title="What have you done? Say it your way.">
            No CV. Just talk, in any language.
          </StepHeader>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="inline-flex rounded-2xl bg-ink/6 p-1 text-lg font-semibold">
                {(
                  [
                    ['talk', Mic, 'Talk'],
                    ['write', Keyboard, 'Write'],
                  ] as const
                ).map(([m, Icon, label]) => (
                  <button key={m} onClick={() => setMode(m)} className={`flex items-center gap-2 rounded-xl px-5 py-2 transition ${mode === m ? 'bg-white text-brand' : 'text-ink/65'}`}>
                    <Icon size={20} /> {label}
                  </button>
                ))}
              </div>
              {mode === 'talk' ? (
                <TalkInterview
                  onDone={(answers) => {
                    setText(answers)
                    translate(answers)
                  }}
                />
              ) : (
                <div className="card space-y-3 p-5">
                   <textarea className="input min-h-64 resize-y text-lg leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} />
                  <button className="btn-primary w-full" onClick={() => translate()} disabled={busy || text.length < 20}>
                    {busy ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />} Find my skills
                  </button>
                </div>
              )}
            </div>
            <div className="card p-6 lg:mt-[60px]">
              {busy ? (
                <div className="grid h-full min-h-60 place-items-center text-lg text-ink/70">
                  <span className="flex items-center gap-3">
                    <Loader2 size={22} className="animate-spin" /> Finding your skills…
                  </span>
                </div>
              ) : !result ? (
                <div className="grid h-full min-h-60 place-items-center text-center">
                  <div className="max-w-sm space-y-3">
                    <Quote size={32} className="mx-auto text-brand" />
                    <p className="text-xl font-semibold">Your skills appear here, each backed by your own words.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.strengths.length === 0 && (
                    <div className="space-y-2 rounded-2xl bg-berry-soft p-5">
                      <div className="text-xl font-bold">We couldn’t find a skill in that yet.</div>
                      <p className="text-lg">{result.reflection_questions[0] ?? 'Tell us one real thing you have done.'}</p>
                    </div>
                  )}
                  <h2 className={`text-2xl font-extrabold ${result.strengths.length ? '' : 'hidden'}`}>Keep what’s true</h2>
                  {result.strengths.map((s) => {
                    const on = kept.includes(s)
                    return (
                      <div key={s.plain} className={`pop flex gap-3 rounded-2xl p-4 transition ${on ? 'bg-mint-soft/60' : 'bg-ink/4 opacity-50'}`}>
                        <div className="flex-1">
                          <div className="text-lg font-bold">{s.plain}</div>
                          <div className="mt-1 text-ink/70">“{s.evidence_quote}”</div>
                        </div>
                        <button className="h-fit rounded-xl p-2 hover:bg-ink/8" onClick={() => setKept((k) => (on ? k.filter((x) => x !== s) : [...k, s]))} aria-label={on ? 'Remove' : 'Keep'} title={on ? 'Remove' : 'Keep'}>
                          {on ? <X size={20} /> : <Check size={20} />}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <NavBar onNext={() => go(1)} disabled={!kept.length} hint={result && !result.strengths.length ? "Add a real example first" : "Answer the 3 questions first"} nextLabel="Choose tables" />
        </>
      )}

      {step === 1 && (
        <>
          <StepHeader eyebrow="Step 2 · Pick tables" title="Pick up to 3 tables">
            Each one is a real company with a real 20-minute task. Yellow marks tasks that use skills you told us about.
          </StepHeader>
          <div className="flex flex-wrap items-center gap-3">
            {(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`chip px-5 py-2 text-base ${filter === f ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/10'}`}>
                {FILTERS[f].label}
              </button>
            ))}
            <button onClick={() => setBestFirst((b) => !b)} className={`chip px-5 py-2 text-base ${bestFirst ? 'bg-mint text-white' : 'bg-white ring-1 ring-ink/10'}`}>
              {bestFirst && <Check size={16} />} Best fit first
            </button>
            <span className="ml-auto text-lg font-bold">{picks.length} of 3 chosen</span>
          </div>
          {(() => {
            const rows = open.filter(FILTERS[filter].test).map((c) => ({ c, fit: fitSkills(c, kept) }))
            const fitting = rows.filter((r) => r.fit.length).sort((x, y) => y.fit.length - x.fit.length)
            const others = rows.filter((r) => !r.fit.length)
            const grid = (list: typeof rows) => (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {list.map(({ c, fit }) => {
                  const hot = (demand[c.id] ?? 0) > c.seatsPerRound * c.rounds
                  return (
                    <div key={c.id} className="relative">
                      <ChallengeCardView card={c} compact fit={fit} selected={picks.includes(c.id)} rank={picks.includes(c.id) ? picks.indexOf(c.id) + 1 : undefined} onSelect={() => toggle(c.id)} />
                      {hot && <span className="chip absolute left-5 top-[-14px] bg-berry text-ink">Popular</span>}
                    </div>
                  )
                })}
              </div>
            )
            if (!bestFirst) return grid(rows)
            return (
              <div className="space-y-8">
                {fitting.length ? grid(fitting) : <p className="rounded-3xl bg-berry-soft p-5 text-lg font-semibold">No table today uses the skills you told us about. You can still pick any table, or go back and add an example.</p>}
                {others.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-extrabold">Other tables</h2>
                    {grid(others)}
                  </div>
                )}
              </div>
            )
          })()}
          <NavBar onBack={() => go(0)} onNext={() => go(2)} disabled={!picks.length} hint="Tap a card to choose it" />
        </>
      )}

      {step === 2 && (
        <>
          <StepHeader eyebrow="Step 3 · Confirm" title="Check and confirm">
            You confirm requirements yourself. Nobody screens you.
          </StepHeader>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card space-y-4 p-6">
              <h2 className="text-2xl font-extrabold">Your tables</h2>
              {picks.map((id, i) => {
                const c = cards.find((x) => x.id === id)!
                return (
                  <div key={id} className="flex items-center gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                    <div>
                      <div className="text-lg font-bold">{c.company}</div>
                      <div className="text-ink/70">{c.title}</div>
                    </div>
                  </div>
                )
              })}
              <h3 className="pt-3 text-xl font-bold">Languages I can work in</h3>
              <div className="flex flex-wrap gap-2">
                {WORK_LANGS.map((l) => {
                  const on = langs.includes(l)
                  return (
                    <button key={l} onClick={() => setLangs((x) => (on ? x.filter((y) => y !== l) : [...x, l]))} className={`chip px-4 py-2 text-base ${on ? 'bg-brand text-white' : 'bg-white ring-1 ring-ink/15'}`}>
                      {on && <Check size={16} />} {l}
                    </button>
                  )
                })}
              </div>
              {needed.length > 0 && <h3 className="pt-3 text-xl font-bold">I have or can get</h3>}
              {needed.map(({ key, m, company }) => (
                <label key={key} className="flex cursor-pointer items-start gap-3 text-lg">
                  <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-brand" checked={!!checks[key]} onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })} />
                  <span>
                    {m} <span className="text-ink/65">({company})</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="space-y-4 rounded-3xl border-2 border-dashed border-brand/30 p-6">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold">
                <EyeOff size={24} className="text-brand" /> What the company sees
              </h2>
              <div className="font-mono text-2xl font-bold text-brand">{me.code}</div>
              <ul className="space-y-1.5 text-lg">
                {kept.slice(0, 4).map((s) => (
                  <li key={s.plain}>• {s.plain}</li>
                ))}
              </ul>
              <div className="text-lg text-ink/75">{langs.length ? langs.join(', ') : 'Pick your languages on the left'}</div>
              <p className="rounded-2xl bg-brand-soft p-4 text-lg font-semibold">No name, photo, age or country until you both say yes.</p>
            </div>
          </div>
          <NavBar
            onBack={() => go(1)}
            onNext={() => {
              setMe({ ...me, languages: langs, choices: picks, checks: Object.keys(checks).filter((k) => checks[k]) })
              go(3)
            }}
            nextLabel="Confirm & get my pass"
          />
        </>
      )}

      {step === 3 && (
        <>
          <StepHeader eyebrow="Step 4 · Your pass" title="You’re in! Here’s your pass.">
            A fair lottery gave everyone a first choice before anyone got a second.
          </StepHeader>
          <div className="card pop grid gap-8 p-8 md:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-3">
              <QRCodeSVG value={`poyta:${me.code}`} size={180} fgColor="#0b1640" />
              <div className="font-mono text-xl font-bold">{me.code}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-brand">
                {EVENT.date}, {EVENT.place}
              </div>
              <div className="mt-4 space-y-3">
                {schedule.map((s) => {
                  const c = cards.find((x) => x.id === s.table)!
                  return (
                    <div key={s.table} className="flex items-center gap-4 rounded-2xl bg-paper p-4">
                      <div className="w-16 font-display text-2xl font-extrabold">{EVENT.rounds[s.round]}</div>
                      <div className="flex-1">
                        <div className="text-lg font-bold">{c.company}</div>
                        <div className="text-ink/70">{c.where === 'online' ? 'Online, video link by email' : c.format === 'team' ? 'Team sprint, Sello Library' : 'Sello Library'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <NavBar onBack={() => go(2)} onNext={() => go(4)} nextLabel="Go to event day" />
        </>
      )}

      {step === 4 && (
        <>
          <StepHeader eyebrow="Step 5 · Event day" title={`You’re at the ${cards.find((c) => c.id === liveTable)!.company} table`}>
            20 minutes on a real problem. Then: do you want to continue?
          </StepHeader>
          <LiveView as="talent" tableId={liveTable} />
          <NavBar onBack={() => go(3)} />
        </>
      )}
    </div>
  )
}
