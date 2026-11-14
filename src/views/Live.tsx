import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, CalendarCheck, Camera, Check, Copy, FastForward, Heart, Link2, Loader2, Pause, Play, Share2, Sparkles } from 'lucide-react'
import { post, useStore } from '../lib/store'
import { EVENT } from '../lib/data'
import { allocate } from '../lib/seating'
import { TeamPlan } from './ChallengeCardView'
import type { Recap } from '../lib/types'

// What the participant answered in the debrief, as the host noted it (demo content).
const ANSWERS: Record<string, string[]> = {
  kvanttia: [
    'Split fast unit tests from the slow integration suite — the slow suite blocks every merge.',
    'Asked which steps actually block a merge, and how often integration tests really fail.',
    'Compare median CI time per pull request for two weeks before and after.',
  ],
  virta: [
    'Overheating: every failed battery ran hot for days before it broke.',
    'Run the rule on last year’s data and count how many alerts would have been false.',
    'The repair log, so we know which alerts led to a real fix.',
  ],
  default: [
    'Started by asking who actually has the problem, then proposed one small first step.',
    'Wanted to see real examples before changing anything.',
    'Suggested trying it for a week and checking with the people affected.',
  ],
}
const HOST_NOTE: Record<string, string> = {
  kvanttia: 'Asked straight away which steps block a merge — nobody had asked that. Practical, explained it clearly. I want to show her the real config.',
  default: 'Asked good questions, proposed a simple first step and explained it clearly. I would like to continue.',
}
const TALENT_NOTE: Record<string, string> = {
  kvanttia: 'Their CI is like our outage queue: everything waits for the slowest job. Questions: is it full-time, which days in office, do they help with the work permit statement?',
  default: 'I liked the problem, it is close to what I did before. Questions: full-time or part-time, which days on site?',
}
// What the person says they did (talent side) and what teammates said (company side, simulated).
const CONTRIB: Record<string, string> = {
  kvanttia: 'I mapped where the 3 hours go and showed that the integration suite blocks every merge.',
  default: 'I took my part, explained it to the team and connected it with a teammate’s idea.',
}
const SIM_LINES: Record<string, string[]> = {
  virta: [
    'Found 3 batteries that overheat every afternoon and linked it to past failures.',
    'Showed capacity drops fastest in the 5 oldest batteries.',
    'Every failed battery had overheated for days before it broke.',
    'Proposed that the alert goes to the field technician, not the customer.',
  ],
}
const TEAM_OUTPUT: Record<string, string> = {
  virta: 'Rule: if a battery runs above 45 °C for 3 days and loses capacity, a technician checks it. First to check: B-07, B-12, B-19.',
  default: 'One page with the plan the team agreed on.',
}
const NAMES = ['Amira K.', 'Jonas P.', 'Mei L.', 'Oskari V.', 'Daniela R.', 'Kwame A.']
const PHASES = ['Sprint', 'Debrief', 'Decide', 'Next step'] as const

function Phone({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[340px] rounded-[2.4rem] border-[7px] border-ink bg-white p-5">
      <div className="mb-4 text-xl font-extrabold leading-snug">{title}</div>
      {children}
    </div>
  )
}

// Event day from one side's perspective; the other side is simulated.
export default function LiveView({ as, tableId = 'kvanttia' }: { as: 'talent' | 'company'; tableId?: string }) {
  const { cards, talents, me, go } = useStore()
  const table = cards.find((c) => c.id === tableId)!
  const round = 1
  const seated = useMemo(() => {
    const codes = allocate(cards, talents)
      .seats.filter((s) => s.table === table.id && s.round === round)
      .map((s) => s.talent)
      .filter((c) => c !== me.code)
    // a freshly published table has no lottery seats yet — fill it for the demo
    const pad = talents.map((t) => t.code).filter((c) => c !== me.code && !codes.includes(c))
    return [me.code, ...codes, ...pad].slice(0, table.seatsPerRound)
  }, [cards, talents, me.code, table])

  const [phase, setPhase] = useState(0)
  const [secs, setSecs] = useState(EVENT.sprintMinutes * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running || secs <= 0) return
    const t = setTimeout(() => setSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [running, secs])
  useEffect(() => {
    if (secs <= 0 && phase === 0) setPhase(1)
  }, [secs, phase])

  // Scripted demo content only fits the task it was written for (Virta's battery task).
  const demoKey = tableId === 'virta' && !table.title.includes('batter') ? 'custom' : tableId
  const key = ANSWERS[demoKey] ? demoKey : 'default'
  const questions = table.debriefQuestions?.length ? table.debriefQuestions : ['How did you approach it?', 'What would you do next?', 'What would you need from us?']
  const answers = ANSWERS[key]

  // Company perspective: host picks; participants' answers are simulated.
  const [hostYes, setHostYes] = useState<string[]>([])
  const talentYes = useMemo(() => new Set([me.code, ...seated.filter((_, i) => i % 2 === 0)]), [seated, me.code])
  // Talent perspective: Amira answers; the host has (simulated) chosen her.
  const [myYes, setMyYes] = useState<boolean | null>(null)
  const matchedCodes = as === 'company' ? hostYes.filter((c) => talentYes.has(c)) : myYes ? [me.code] : []

  const isTeam = table.format === 'team'
  const teams = isTeam ? [0, 1, 2].map((t) => seated.slice(t * 4, t * 4 + 4)) : [seated]
  const partOf = (j: number) => table.parts?.at(j % 4)?.split(':')[0] ?? `Part ${j + 1}`
  const simLine = (c: string) => {
    const j = seated.indexOf(c) % 4
    return SIM_LINES[demoKey]?.at(j) ?? `Worked on “${partOf(j)}” and explained it to the team.`
  }

  // Talent: own answers, own line, the team's result.
  const [myAnswers, setMyAnswers] = useState(() => questions.map(() => ''))
  const [contribution, setContribution] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [link, setLink] = useState('')
  const talentReady = myAnswers.every((a) => a.trim()) && contribution.trim()

  // Company: what the host saw — behaviours from the card, plus a few words. No scores.
  const [teamIdx, setTeamIdx] = useState(0)
  const [seen, setSeen] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const toggleSeen = (c: string, b: string) => setSeen((s) => ({ ...s, [c]: s[c]?.includes(b) ? s[c].filter((x) => x !== b) : [...(s[c] ?? []), b] }))

  const [recap, setRecap] = useState<Recap | null>(null)
  const [busy, setBusy] = useState(false)
  const [recapErr, setRecapErr] = useState(false)
  const [booked, setBooked] = useState<string | null>(null)
  // The Sprint Record travels into a company's normal hiring process as a link.
  const [attach, setAttach] = useState(false)
  const [copied, setCopied] = useState(false)
  const recordLink = `${location.origin}/record/${me.code.toLowerCase()}-${table.id}`

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="space-y-8">
      {/* phase indicator */}
      <ol className="grid grid-cols-4 gap-2">
        {PHASES.map((p, i) => (
          <li key={p} className="space-y-2">
            <div className={`h-2 rounded-full ${i < phase ? 'bg-mint' : i === phase ? 'bg-brand' : 'bg-ink/10'}`} />
            <div className={`flex items-center gap-1.5 text-lg font-bold ${i === phase ? 'text-brand' : i < phase ? 'text-mint' : 'text-ink/60'}`}>
              {i < phase && <Check size={18} />}
              {p}
            </div>
          </li>
        ))}
      </ol>

      {phase === 0 && (
        <section className="card pop space-y-6 p-8">
          <div className="text-center">
            <div className="font-display text-8xl font-extrabold tabular-nums md:text-9xl">
              {mm}:{ss}
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button className="btn-primary px-7 text-lg" onClick={() => setRunning(!running)}>
                {running ? <Pause size={20} /> : <Play size={20} />} {running ? 'Pause' : 'Start the 20 minutes'}
              </button>
              <button className="btn-ghost" onClick={() => setSecs(0)} title="Demo: skip to the end">
                <FastForward size={20} /> Skip (demo)
              </button>
            </div>
          </div>
          <div className="rounded-3xl bg-brand-soft p-6">
            <div className="text-lg font-bold text-brand">The task</div>
            <p className="mt-1 text-xl">{table.atTheTable}</p>
          </div>
          {table.format === 'team' && <TeamPlan />}
          {isTeam ? (
            <div className="grid gap-4 md:grid-cols-3">
              {teams.map((team, t) => (
                <div key={t} className="rounded-3xl bg-paper p-4">
                  <div className="mb-3 text-xl font-extrabold">Team {'ABC'[t]}</div>
                  <ul className="space-y-2">
                    {team.map((c, j) => (
                      <li key={c} className={`flex items-center gap-3 rounded-2xl p-2 ${c === me.code && as === 'talent' ? 'bg-brand text-white' : 'bg-white'}`}>
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold ${c === me.code && as === 'talent' ? 'bg-white text-brand' : 'bg-berry text-ink'}`}>{c}</span>
                        <span className="leading-snug">{partOf(j)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              {seated.map((c) => (
                <div key={c} className={`grid h-16 w-16 place-items-center rounded-full font-bold ${c === me.code && as === 'talent' ? 'bg-brand text-white' : 'bg-berry text-ink'}`}>
                  {c}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {phase === 1 && as === 'talent' && (
        <section className="card pop space-y-6 p-6 md:p-8">
          <div>
            <h2 className="text-3xl font-extrabold">Your answers</h2>
            <p className="mt-1 text-xl text-ink/70">The host reads them under your code, not your name.</p>
          </div>
          {questions.map((q, i) => (
            <label key={q} className="block space-y-2">
              <span className="block text-xl font-bold">
                {i + 1}. {q}
              </span>
              <textarea className="input min-h-28 text-lg" value={myAnswers[i]} onChange={(e) => setMyAnswers((a) => a.map((x, k) => (k === i ? e.target.value : x)))} />
            </label>
          ))}
          <label className="block space-y-2">
            <span className="block text-xl font-bold">Your part, in one line</span>
            <textarea className="input min-h-24 text-lg" value={contribution} onChange={(e) => setContribution(e.target.value)} placeholder="What did you do, and how did it help the team?" />
          </label>
          <div className="space-y-3">
            <div className="text-xl font-bold">{isTeam ? 'Your team’s result' : 'Your result'}</div>
            {photo ? (
              <img src={photo} alt="Your team’s result" className="max-h-64 rounded-2xl border border-ink/10" />
            ) : (
              <div className="flex flex-wrap gap-3">
                <label className="btn-ghost cursor-pointer">
                  <Camera size={20} /> Add a photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && setPhoto(URL.createObjectURL(e.target.files[0]))} />
                </label>
                <div className="flex min-w-60 flex-1 items-center gap-2 rounded-2xl border-2 border-ink/10 bg-white px-4">
                  <Link2 size={20} className="text-ink/60" />
                  <input className="w-full py-3 text-lg outline-none" placeholder="or paste a link" value={link} onChange={(e) => setLink(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="btn-ghost"
              onClick={() => {
                setMyAnswers(questions.map((_, i) => answers.at(i) ?? ''))
                setContribution(CONTRIB[key])
              }}
            >
              Use example answers
            </button>
            <button className="btn-primary px-7 text-lg" disabled={!talentReady} onClick={() => setPhase(2)}>
              Next: would you like to continue? <ArrowRight size={20} />
            </button>
          </div>
        </section>
      )}

      {phase === 1 && as === 'company' && (
        <section className="card pop space-y-6 p-6 md:p-8">
          <div>
            <h2 className="text-3xl font-extrabold">What did you see?</h2>
            <p className="mt-1 text-xl text-ink/70">Tap what happened, add a few words. No scores.</p>
          </div>
          {isTeam && (
            <div className="flex flex-wrap gap-2">
              {teams.map((_, t) => (
                <button key={t} onClick={() => setTeamIdx(t)} className={`chip px-5 py-2 text-base ${teamIdx === t ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15'}`}>
                  Team {'ABC'[t]}
                </button>
              ))}
            </div>
          )}
          {isTeam && (
            <div className="rounded-3xl bg-brand-soft p-5 text-lg">
              <div className="font-bold text-brand">Team {'ABC'[teamIdx]} handed over</div>
              {TEAM_OUTPUT[demoKey] ?? table.teamResult ?? TEAM_OUTPUT.default}
            </div>
          )}
          <ul className="space-y-4">
            {teams[teamIdx].map((c, j) => (
              <li key={c} className="space-y-3 rounded-3xl border-2 border-ink/8 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-berry text-sm font-bold">{c}</span>
                  {isTeam && <span className="text-lg font-bold">{partOf(j)}</span>}
                </div>
                <p className="text-lg text-ink/80">“{simLine(c)}”</p>
                <div className="flex flex-wrap gap-2">
                  {table.goodLooksLike.map((b) => {
                    const on = seen[c]?.includes(b)
                    return (
                      <button key={b} onClick={() => toggleSeen(c, b)} className={`chip px-4 py-2 text-base ${on ? 'bg-mint text-white' : 'bg-white ring-1 ring-ink/15'}`}>
                        {on && <Check size={16} />} {b}
                      </button>
                    )
                  })}
                </div>
                <input className="input" placeholder="A few words: what did they do?" value={notes[c] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [c]: e.target.value }))} />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              className="btn-ghost"
              onClick={() => {
                const [a1, a2] = teams[0]
                const g = table.goodLooksLike
                setTeamIdx(0)
                setSeen({ [a1]: [g[0], g[1]], [a2]: [g[0]] })
                setNotes(
                  demoKey === 'virta'
                    ? { [a1]: 'Linked her finding to the past failures. The team built the rule on it.', [a2]: 'Clear, short summary of the capacity data.' }
                    : { [a1]: 'Connected her part with a teammate’s finding. The team built the plan on it.', [a2]: 'Clear, short summary of his part.' },
                )
              }}
            >
              Use example notes
            </button>
            <button className="btn-primary px-7 text-lg" onClick={() => setPhase(2)}>
              Next: would you like to continue? <ArrowRight size={20} />
            </button>
          </div>
        </section>
      )}

      {phase === 2 && (
        <section className="pop grid items-center gap-10 md:grid-cols-[340px_1fr]">
          {as === 'talent' ? (
            <Phone title={`Continue with ${table.company}?`}>
              <div className="space-y-3">
                <button className={`btn w-full py-4 text-xl ${myYes ? 'bg-mint text-white' : 'bg-brand text-white hover:bg-brand-deep'}`} onClick={() => setMyYes(true)}>
                  <Heart size={22} /> Yes
                </button>
                <button className={`btn w-full py-4 text-xl ${myYes === false ? 'bg-ink text-white' : 'bg-ink/6'}`} onClick={() => setMyYes(false)}>
                  Not for me
                </button>
                <p className="pt-1 text-center text-ink/70">The company never sees a “no”.</p>
              </div>
            </Phone>
          ) : (
            <Phone title="Who would you like to meet again?">
              <div className={seated.length > 6 ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
                {seated.map((c) => (
                  <button
                    key={c}
                    onClick={() => setHostYes((h) => (h.includes(c) ? h.filter((x) => x !== c) : [...h, c]))}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-lg transition ${hostYes.includes(c) ? 'border-brand bg-brand-soft' : 'border-ink/10'}`}
                  >
                    <span className="font-bold">{c}</span>
                    <Heart size={22} className={hostYes.includes(c) ? 'fill-brand text-brand' : 'text-ink/60'} />
                  </button>
                ))}
              </div>
            </Phone>
          )}
          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold leading-tight">Both say yes, or nothing happens.</h2>
            <p className="text-xl text-ink/75">Names appear only on a mutual yes.</p>
            {as === 'talent' && myYes === false ? (
              <div className="pop space-y-4">
                <p className="text-xl font-semibold">No problem. {table.company} won’t see this.</p>
                <button className="btn-primary px-7 text-lg" onClick={() => go('welcome')}>
                  Done, back to start <ArrowRight size={20} />
                </button>
              </div>
            ) : (
            <button className="btn-primary px-7 text-lg" disabled={matchedCodes.length === 0} onClick={() => setPhase(3)}>
              {matchedCodes.length ? `See ${matchedCodes.length} mutual match${matchedCodes.length > 1 ? 'es' : ''}` : as === 'talent' ? 'Tap “Yes” first' : 'Tap the people you’d like to meet'} <ArrowRight size={20} />
            </button>
            )}
          </div>
        </section>
      )}

      {phase === 3 && (
        <section className="pop grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Sprint Record */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 bg-ink px-6 py-5 text-white">
              <BadgeCheck size={30} className="shrink-0 text-berry" />
              <div className="flex-1">
                <div className="text-lg text-white/75">Sprint Record</div>
                <div className="font-display text-2xl font-extrabold">{as === 'company' ? NAMES[seated.indexOf(matchedCodes[0])] ?? 'Amira K.' : 'Amira K.'}</div>
              </div>
              <div className="text-right text-white/75">{table.company}</div>
            </div>
            <div className="space-y-5 p-6 text-lg">
              <div>
                <div className="font-bold">The problem</div>
                {table.title}
              </div>
              <div>
                <div className="font-bold">{isTeam ? 'Their part' : 'What they did'}</div>
                {as === 'talent' ? contribution : simLine(matchedCodes[0])}
              </div>
              <div>
                <div className="font-bold">{isTeam ? 'Team result' : 'Result'}</div>
                {as === 'talent' && photo ? (
                  <img src={photo} alt="Team result" className="mt-2 max-h-48 rounded-2xl border border-ink/10" />
                ) : as === 'talent' && link ? (
                  <a href={link} className="font-semibold text-brand underline" target="_blank" rel="noreferrer">
                    {link}
                  </a>
                ) : (
                  (TEAM_OUTPUT[demoKey] ?? table.teamResult ?? TEAM_OUTPUT.default)
                )}
              </div>
              <div>
                <div className="font-bold">Their answers</div>
                <ul className="mt-1 space-y-1.5">
                  {(as === 'talent' ? myAnswers : answers).map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 rounded-3xl bg-brand-soft p-5">
                <div className="font-bold text-brand">The host noticed</div>
                {as === 'company' && seen[matchedCodes[0]]?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {seen[matchedCodes[0]].map((b) => (
                      <span key={b} className="chip bg-mint text-white">
                        <Check size={16} /> {b}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div>“{(as === 'company' && notes[matchedCodes[0]]) || HOST_NOTE[key]}”</div>
              </div>
              {as === 'talent' &&
                (attach ? (
                  <div className="pop space-y-3 rounded-3xl border-2 border-brand/30 p-5">
                    <div className="font-bold">Add this to any job application</div>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-xl bg-paper px-3 py-2 text-base">{recordLink}</code>
                      <button
                        className="btn-primary px-4 py-2"
                        onClick={() => {
                          navigator.clipboard?.writeText(recordLink).catch(() => {})
                          setCopied(true)
                        }}
                      >
                        {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-ink/75">Paste it where a form asks for a CV or portfolio link. The company sees the task, what you did and the host’s note. You can turn the link off any time.</p>
                  </div>
                ) : (
                  <button className="btn-ghost" onClick={() => setAttach(true)}>
                    <Share2 size={20} /> Attach to your application
                  </button>
                ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card space-y-4 p-6">
              <div className="flex items-start gap-3 text-xl font-bold">
                <CalendarCheck size={26} className="mt-0.5 shrink-0 text-mint" /> {(table.followUp || 'Follow-up within 7 days').replace(' if it’s mutual', '')}
              </div>
              {booked ? (
                <div className="pop rounded-2xl bg-mint-soft p-4 text-lg font-semibold text-mint">Booked: {booked}</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {['Tue 9 Dec, 10:00', 'Wed 10 Dec, 14:00'].map((s) => (
                    <button key={s} className="btn-ghost" onClick={() => setBooked(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-lg text-ink/70">After 30 days we ask: did it lead somewhere?</p>
            </div>

            <div className="card space-y-4 p-6">
              <div className="text-xl font-bold">Summary for your next meeting</div>
              {!recap ? (
                <button
                  className="btn-primary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      setRecap(await post<Recap>('/api/recap', { cardTitle: table.title, companyNote: (as === 'company' && notes[matchedCodes[0]]) || HOST_NOTE[key], talentNote: as === 'talent' ? `${contribution} ${myAnswers.join(' ')}` : TALENT_NOTE[key] }))
                    } catch {
                      setRecapErr(true)
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  {busy ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />} {recapErr ? 'Try again' : 'Create summary'}
                </button>
              ) : (
                <div className="pop space-y-4 text-lg">
                  <div>
                    <div className="font-bold">You both talked about</div>
                    {recap.common_ground.map((x) => (
                      <div key={x}>• {x}</div>
                    ))}
                  </div>
                  <div>
                    <div className="font-bold">Still open</div>
                    {recap.open_questions.map((x) => (
                      <div key={x}>• {x}</div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-mint-soft p-4">
                    <div className="font-bold text-mint">Next step</div>
                    {recap.suggested_next_step}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
