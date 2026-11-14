import { useEffect, useRef, useState } from 'react'
import { Bot, CheckCircle2, LibraryBig, Loader2, MessageSquare, Pencil, Send, Sparkles } from 'lucide-react'
import { useSpeech } from '../lib/useSpeech'
import MicButton from './MicButton'
import { post, useStore } from '../lib/store'
import type { ChallengeCard, IntakeResult, IntakeTurn } from '../lib/types'
import ChallengeCardView from './ChallengeCardView'
import LiveView from './Live'
import TaskLibrary from './TaskLibrary'
import { live, saveTableKey } from '../lib/live'
import { NavBar, StepHeader, Stepper } from './Wizard'

// Example answers so the demo can be clicked through quickly on stage.
const SUGGESTED = [
  'We monitor about 3000 home batteries. Honestly we find out a battery is dying only when the customer calls angry. I need someone to make sense of the sensor data.',
  'Our two engineers spend every Friday reading logs by hand. Last month we missed 6 failures. A good first week: they look at the data and tell us what early warning signs exist.',
  'Fluent Finnish? Probably not needed, our team speaks English. Python would be nice. No licences.',
]

const STEPS = ['Your need', 'Review & publish', 'Event day']
const FORMATS = [
  { id: 'team', title: 'Team sprint', body: '12 people in 3 teams. See how they work together.' },
  { id: 'sprint', title: 'Small table', body: '4 people, you work with them directly.' },
] as const
const WHERES = [
  { id: 'onsite', title: 'In person' },
  { id: 'online', title: 'Online' },
  { id: 'both', title: 'Both' },
] as const
const FOLLOW_UPS = ['45-min follow-up within 7 days if it’s mutual', 'Interview the same week if it’s mutual', 'Paid trial day (työkokeilu) within 2 weeks if it’s mutual']

export default function CompanyView() {
  const { cards, upsertCard } = useStore()
  const existing = cards.find((c) => c.id === 'virta')!
  const [tableId, setTableId] = useState('virta')
  const [step, setStep] = useState(0)
  const [turns, setTurns] = useState<IntakeTurn[]>([])
  const [draft, setDraft] = useState('')
  const [netErr, setNetErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [card, setCard] = useState<IntakeResult['card']>(null)
  const [approved, setApproved] = useState(false)
  const [followUp, setFollowUp] = useState(FOLLOW_UPS[0])
  const [format, setFormat] = useState<ChallengeCard['format']>('team')
  const [where, setWhere] = useState<ChallengeCard['where']>('both')
  const [mode, setMode] = useState<'talk' | 'library'>('talk')
  const [editing, setEditing] = useState(false)
  // The company says who it is first; the AI interview starts after that.
  const [name, setName] = useState('')
  const [blurb, setBlurb] = useState('')
  const [named, setNamed] = useState(false)
  const bottom = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const userCount = turns.filter((t) => t.role === 'user').length

  async function send(next: IntakeTurn[]) {
    setBusy(true)
    setNetErr(false)
    try {
      const r = await post<IntakeResult>('/api/intake', { company: blurb.trim() ? `${name.trim()} (${blurb.trim()})` : name.trim(), turns: next })
      setTurns([...next, { role: 'assistant', content: r.reply }])
      if (r.card) setCard(r.card)
    } catch {
      setNetErr(true)
      const last = next.at(-1)
      if (last?.role === 'user') setDraft(last.content)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!named || started.current) return
    started.current = true
    send([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [named])
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns, busy])

  const submit = (text: string) => {
    if (!text.trim() || busy) return
    setDraft('')
    send([...turns, { role: 'user', content: text.trim() }])
  }

  const mic = useSpeech('en-US', (t) => submit(t))

  const full: ChallengeCard | null = card ? {
        ...existing,
        company: name.trim() || existing.company,
        companyBlurb: blurb.trim() || existing.companyBlurb,
        ...card,
        format: card.format === 'taster' ? 'taster' : format,
        where,
        seatsPerRound: card.format === 'taster' ? 6 : format === 'team' ? 12 : 4,
        followUp,
        status: approved ? 'approved' : 'draft',
        daysBeforeEvent: 21,
      } : null
  const go = (i: number) => {
    setStep(i)
    scrollTo({ top: 0 })
  }

  return (
    <div className="space-y-8">
      <Stepper steps={STEPS} current={step} onJump={go} />

      {step === 0 && (
        <>
          <StepHeader eyebrow="Step 1" title={named ? `What problem could people solve with ${name.trim()}?` : 'Who are you?'}>
            Bring a challenge, not a booth. You meet people after you’ve seen them work.
          </StepHeader>
          {!named ? (
            <form
              className="card mx-auto max-w-2xl space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault()
                if (name.trim()) setNamed(true)
              }}
            >
              <label className="block space-y-1">
                <span className="text-lg font-bold">Company name</span>
                <input className="input" placeholder="e.g. Virta Grid" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </label>
              <label className="block space-y-1">
                <span className="text-lg font-bold">What you do, in one line</span>
                <input className="input" placeholder="e.g. Battery monitoring for homes, 12 people" value={blurb} onChange={(e) => setBlurb(e.target.value)} />
              </label>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" disabled={!name.trim()}>
                  Continue
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setName(existing.company)
                    setBlurb(`${existing.companyBlurb}, ${existing.size}`)
                    setNamed(true)
                  }}
                >
                  Use demo company: {existing.company}
                </button>
              </div>
            </form>
          ) : (
            <>
          <div className="mx-auto flex max-w-3xl gap-1.5 rounded-3xl bg-ink/6 p-1.5">
            {(['talk', 'library'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-lg font-bold transition ${mode === m ? 'bg-white text-brand ring-1 ring-ink/8' : 'text-ink/65 hover:text-ink'}`}
              >
                {m === 'talk' ? <MessageSquare size={20} /> : <LibraryBig size={20} />} {m === 'talk' ? 'Answer 3 questions' : 'Pick a ready task'}
              </button>
            ))}
          </div>
          {mode === 'library' ? (
            <div className="mx-auto max-w-5xl">
              <TaskLibrary
                onPick={(t) => {
                  const { id: _id, sector: _sector, ...picked } = t
                  setCard(picked)
                  if (t.format !== 'taster') setFormat(t.format)
                  go(1)
                }}
              />
            </div>
          ) : (
            <>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3 text-center">
            {[
              ['31', 'do data analysis'],
              ['18', 'know Python'],
              ['22', 'serve customers'],
            ].map(([n, l]) => (
              <div key={l} className="rounded-3xl bg-brand-soft px-3 py-4">
                <div className="font-display text-4xl font-extrabold text-brand">{n}</div>
                <div className="text-lg">{l}</div>
              </div>
            ))}
            <p className="col-span-3 text-lg text-ink/70">people in Espoo’s pool you could meet</p>
          </div>
          <div className="card mx-auto flex h-[560px] max-w-3xl flex-col overflow-hidden">
            <div className="flex items-center gap-3 border-b border-ink/8 px-6 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand">
                <Bot size={20} />
              </span>
              <div className="text-lg font-bold">työpöytä assistant</div>
              <span className="chip ml-auto bg-ink/6 text-ink/75">Question {Math.min(userCount + 1, 3)} of 3</span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {turns.map((t, i) => (
                <div key={i} className={`pop flex ${t.role === 'user' ? 'justify-end' : ''}`}>
                  <div className={`max-w-[85%] rounded-3xl px-5 py-3 text-lg ${t.role === 'user' ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-paper'}`}>{t.content}</div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-lg text-ink/70">
                  <Loader2 size={20} className="animate-spin" /> {userCount >= 3 ? 'Writing your challenge…' : 'Thinking…'}
                </div>
              )}
              {card && (
                <div className="pop flex items-center gap-3 rounded-2xl bg-mint-soft p-4 text-lg font-semibold text-mint">
                  <Sparkles size={22} /> Your challenge is ready.
                </div>
              )}
              <div ref={bottom} />
            </div>
            {!card && (
              <div className="space-y-3 border-t border-ink/8 p-4">
                {netErr && <p className="font-semibold text-rose">Connection problem. Your answer is in the box, try again.</p>}
                {SUGGESTED[userCount] && !busy && (
                  <button onClick={() => submit(SUGGESTED[userCount])} className="w-full truncate rounded-2xl border-2 border-dashed border-brand/30 px-4 py-2.5 text-left text-lg text-brand hover:bg-brand-soft">
                    <span className="font-bold">Use example answer: </span>
                    {SUGGESTED[userCount].slice(0, 60)}…
                  </button>
                )}
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    submit(draft)
                  }}
                >
                  <MicButton listening={mic.listening} onStart={mic.start} onStop={mic.stop} />
                  <input className="input" placeholder={mic.listening ? 'Listening… tap ■ to send' : mic.error ?? 'Speak or type your answer…'} value={mic.interim || draft} onChange={(e) => setDraft(e.target.value)} />
                  <button className="btn-primary px-4" disabled={busy || !draft.trim()} aria-label="Send">
                    <Send size={20} />
                  </button>
                </form>
              </div>
            )}
          </div>
            </>
          )}
            </>
          )}
          <NavBar onNext={() => go(1)} disabled={!card} hint={!named ? 'Tell us who you are first' : mode === 'library' ? 'Pick a task above' : 'Answer the 3 questions first'} nextLabel="Review challenge" />
        </>
      )}

      {step === 1 && full && (
        <>
          <StepHeader eyebrow="Step 2 · Review & publish" title="This is what job seekers will see">
            You’re the author. Change anything.
          </StepHeader>
          <div className="mx-auto max-w-2xl space-y-6">
            {!approved && (
              <div className="card space-y-4 p-6">
                <div className="text-2xl font-extrabold">How do you want to meet?</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`rounded-2xl border-2 p-4 text-left transition ${format === f.id ? 'border-brand bg-brand-soft' : 'border-ink/10 hover:border-ink/25'}`}
                    >
                      <div className="text-xl font-bold">{f.title}</div>
                      <div className="text-ink/75">{f.body}</div>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {WHERES.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setWhere(w.id)}
                      className={`chip px-5 py-2 text-base ${where === w.id ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15'}`}
                    >
                      {w.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!approved && (
              <div className="card space-y-3 p-6">
                <div className="text-2xl font-extrabold">If you both say yes, you promise…</div>
                {FOLLOW_UPS.map((f) => (
                  <label key={f} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-lg transition ${followUp === f ? 'border-brand bg-brand-soft' : 'border-ink/10'}`}>
                    <input type="radio" className="h-5 w-5 accent-brand" checked={followUp === f} onChange={() => setFollowUp(f)} /> {f.replace(' if it’s mutual', '')}
                  </label>
                ))}
              </div>
            )}
            {!approved && card && (
              <div className="card space-y-4 p-6">
                <button className="btn-ghost" onClick={() => setEditing((e) => !e)}>
                  <Pencil size={20} /> {editing ? 'Done editing' : 'Edit the text'}
                </button>
                {editing && (
                  <div className="space-y-3">
                    <label className="block space-y-1">
                      <span className="text-lg font-bold">Title</span>
                      <input className="input" value={card.title} onChange={(e) => setCard({ ...card, title: e.target.value })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-lg font-bold">The problem</span>
                      <textarea className="input min-h-24" value={card.problem} onChange={(e) => setCard({ ...card, problem: e.target.value })} />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-lg font-bold">At the table</span>
                      <textarea className="input min-h-24" value={card.atTheTable} onChange={(e) => setCard({ ...card, atTheTable: e.target.value })} />
                    </label>
                    {format === 'team' && card.format !== 'taster' && (
                      <>
                        <span className="block text-lg font-bold">Four parts, one per person</span>
                        {[0, 1, 2, 3].map((i) => (
                          <input
                            key={i}
                            className="input"
                            placeholder={`Part ${i + 1}`}
                            value={card.parts?.at(i) ?? ''}
                            onChange={(e) => setCard({ ...card, parts: [0, 1, 2, 3].map((k) => (k === i ? e.target.value : card.parts?.at(k) ?? '')) })}
                          />
                        ))}
                        <label className="block space-y-1">
                          <span className="text-lg font-bold">Together they hand over</span>
                          <input className="input" value={card.teamResult ?? ''} onChange={(e) => setCard({ ...card, teamResult: e.target.value })} />
                        </label>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            <ChallengeCardView card={full} />
            {approved && (
              <div className="pop flex items-center gap-3 rounded-3xl bg-mint-soft p-5 text-xl font-bold text-mint">
                <CheckCircle2 size={28} className="shrink-0" /> Published. Job seekers on any phone can pick your table now.
              </div>
            )}
          </div>
          {approved ? (
            <NavBar onBack={() => go(0)} onNext={() => go(2)} nextLabel="Go to event day" />
          ) : (
            <NavBar
              onBack={() => go(0)}
              onNext={async () => {
                setApproved(true)
                try {
                  // Publish to the shared event: job seekers on any device can now pick this table.
                  const r = await live.publish({ ...full, status: 'approved' })
                  saveTableKey(r.id, r.token)
                  upsertCard({ ...full, id: r.id, status: 'approved' })
                  setTableId(r.id)
                } catch {
                  upsertCard({ ...full, status: 'approved' })
                }
              }}
              nextLabel="Approve & publish"
            />
          )}
        </>
      )}

      {step === 2 && (
        <>
          <StepHeader eyebrow="Step 3 · Event day" title={format === 'team' ? 'Your team sprint: 12 people, one real problem' : 'Your table: 4 people, one real problem'}>
            You see names only when it’s mutual.
          </StepHeader>
          <LiveView as="company" tableId={tableId} />
          <NavBar onBack={() => go(1)} />
        </>
      )}
    </div>
  )
}
