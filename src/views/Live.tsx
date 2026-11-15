import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, BadgeCheck, CalendarCheck, Camera, Check, Copy, FastForward, Heart, Link2, Loader2, Pause, Play, Share2, Sparkles } from 'lucide-react'
import { post, useStore } from '../lib/store'
import { EVENT } from '../lib/data'
import { allocate } from '../lib/seating'
import { TeamPlan } from './ChallengeCardView'
import { live, myPerson, tableKeys } from '../lib/live'
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
const SESSION_ANSWERS: Record<string, Record<number, string[]>> = {
  virta: {
    0: ['The oldest batteries lose capacity while their temperature rises.', 'I compared the temperature and capacity columns before suggesting a model.', 'I would validate the warning against last year’s repair log.'],
    1: ['The alert should go to a technician before the customer sees a warning.', 'I separated a signal that needs action from a signal that only needs monitoring.', 'I would test the rule on two weeks of historical data first.'],
    2: ['The first version should be simple enough to explain during a handover.', 'I connected the alert rule to the technician’s actual workflow.', 'I would measure missed failures and false alarms separately.'],
  },
  default: {
    0: ['I started by sorting the evidence into facts and assumptions.', 'I asked the team which constraint mattered most before choosing a direction.', 'I would test the smallest useful change first.'],
    1: ['I turned the first idea into a practical next step.', 'I changed my approach after hearing a teammate’s evidence.', 'I would try this with one real user before expanding it.'],
    2: ['I focused on making the handover clear to someone who was not in the room.', 'I explained the trade-off behind our final choice.', 'I would agree on one measure of success before starting.'],
  },
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
const SESSION_CONTRIB: Record<string, Record<number, string>> = {
  virta: {
    0: 'I compared the sensor columns and found the heat-plus-capacity pattern.',
    1: 'I turned the pattern into an alert rule the technician can act on.',
    2: 'I wrote the handover and defined how we would measure false alarms.',
  },
  default: {
    0: 'I sorted the evidence and helped the team agree on the key constraint.',
    1: 'I turned our first idea into a practical test with a clear owner.',
    2: 'I explained the final trade-off and the measure we would use next.',
  },
}
const SIM_LINES: Record<string, string[]> = {
  virta: [
    'Found 3 batteries that overheat every afternoon and linked it to past failures.',
    'Showed capacity drops fastest in the 5 oldest batteries.',
    'Every failed battery had overheated for days before it broke.',
    'Proposed that the alert goes to the field technician, not the customer.',
  ],
}
const SESSION_SIM_LINES: Record<string, Record<number, string[]>> = {
  virta: {
    0: [
      'Compared afternoon temperature trends across the battery sample.',
      'Marked the batteries with the clearest capacity drop.',
      'Linked a rising temperature pattern to previous repairs.',
      'Checked whether the signal appeared before the failure date.',
      'Separated normal hot-weather readings from risky readings.',
      'Counted how many batteries matched both warning signs.',
      'Asked which sensor values were reliable enough to trust.',
      'Compared old and recently installed batteries.',
      'Found a battery whose capacity fell before its temperature rose.',
      'Explained why the first signal was worth testing.',
      'Flagged a data gap that could create a false warning.',
      'Summarised the strongest evidence for the team.',
    ],
    1: [
      'Mapped which alert should reach the technician first.',
      'Separated urgent alerts from background monitoring.',
      'Suggested a threshold that would reduce false alarms.',
      'Connected the rule to the customer support workflow.',
      'Checked what the customer should see while a technician is called.',
      'Compared a one-day spike with a persistent warning.',
      'Asked who owns the alert after it is created.',
      'Proposed grouping repeated readings into one alert.',
      'Tested the rule against a known failed battery.',
      'Challenged an alert that would create too much noise.',
      'Explained the difference between monitoring and intervention.',
      'Summarised the alert flow from sensor to technician.',
    ],
    2: [
      'Wrote the rule in plain language for the handover.',
      'Checked what the technician would need to act.',
      'Proposed measures for missed failures and false alarms.',
      'Summarised the next experiment for the host.',
      'Turned the team’s evidence into one clear recommendation.',
      'Added the historical-data check before rollout.',
      'Named the decision that still needs a human owner.',
      'Explained the rule without using a technical shortcut.',
      'Connected the result to the repair team’s daily workflow.',
      'Suggested what should be documented for the next shift.',
      'Pointed out the risk of changing the threshold too early.',
      'Presented the final handover and the first success measure.',
    ],
  },
  default: {
    0: [
      'Sorted the evidence before proposing a solution.',
      'Found the constraint that shaped the first plan.',
      'Compared two possible starting points.',
      'Summarised the facts for the team.',
      'Asked who experiences the problem most often.',
      'Separated an assumption from something the data showed.',
      'Mapped the current process step by step.',
      'Found the part of the task that needed clarification.',
      'Explained why one option was more practical.',
      'Checked what would make the first test safe.',
      'Noted a trade-off the team had not discussed.',
      'Presented the evidence behind the starting direction.',
    ],
    1: [
      'Turned the first idea into a testable next step.',
      'Built on a teammate’s new evidence.',
      'Checked the plan against the real user need.',
      'Explained the trade-off behind the choice.',
      'Simplified the proposal so a busy user could try it.',
      'Asked what result would prove the idea useful.',
      'Connected two teammates’ findings into one plan.',
      'Tested the plan against the main constraint.',
      'Suggested a smaller experiment before a full rollout.',
      'Found a missing owner for the next action.',
      'Explained what the team should not change yet.',
      'Summarised the practical test for the host.',
    ],
    2: [
      'Made the handover clear and easy to act on.',
      'Connected the result to one measure of success.',
      'Named the biggest remaining risk.',
      'Presented the team’s final recommendation.',
      'Turned a long discussion into three decisions.',
      'Explained the reason behind the team’s compromise.',
      'Added the first follow-up step to the handover.',
      'Checked that the result answered the original problem.',
      'Identified what the next team should verify.',
      'Made the language clearer for a non-specialist.',
      'Pointed out which assumption still needs testing.',
      'Delivered the final summary and next action.',
    ],
  },
}
const GENERIC_SESSION_ACTIONS = [
  ['identified the strongest evidence in', 'compared two patterns in', 'checked the main constraint in', 'mapped the current process for', 'questioned an assumption in', 'found a useful exception in', 'summarised the key facts from', 'tested the first idea against', 'connected two findings in', 'flagged a risk in', 'explained the practical impact of', 'prepared a clear handover for'],
  ['turned the evidence into a test for', 'built on a teammate’s finding about', 'checked the proposed change against', 'simplified the approach to', 'found an owner for the next step in', 'challenged a weak assumption about', 'compared two solutions for', 'made the plan more useful for', 'defined a success measure for', 'connected the team’s ideas about', 'identified what to test next in', 'summarised the agreed action for'],
  ['wrote the final recommendation for', 'explained the trade-off in', 'checked the result against', 'made the team handover clear for', 'named the remaining risk in', 'defined the first follow-up for', 'translated the result into action for', 'confirmed what should happen next with', 'made the conclusion easier to use for', 'connected the result to the original need in', 'highlighted what still needs testing in', 'presented the team’s decision about'],
]
const TEAM_OUTPUT: Record<string, string> = {
  virta: 'Rule: if a battery runs above 45 °C for 3 days and loses capacity, a technician checks it. First to check: B-07, B-12, B-19.',
  default: 'One page with the plan the team agreed on.',
}
const SESSION_TEAM_OUTPUT: Record<string, Record<number, string>> = {
  virta: {
    0: 'Finding: sustained heat plus falling capacity is the strongest early warning signal.',
    1: 'Alert rule: notify a technician when the signal persists for three days; keep the customer message separate.',
    2: 'Handover: test the rule on historical data, then monitor false alarms and missed failures for two weeks.',
  },
  default: {
    0: 'Evidence map: the team agreed on the facts and the most important constraint.',
    1: 'Next step: one small test with a clear owner, user and success measure.',
    2: 'Final handover: the agreed plan, its trade-off and the first way to check it worked.',
  },
}
const NAMES = ['Amira K.', 'Jonas P.', 'Mei L.', 'Oskari V.', 'Daniela R.', 'Kwame A.']
const PHASES = ['Sprint', 'Debrief', 'Decide', 'Next step'] as const
type SessionSnapshot = {
  phase: number
  secs: number
  myAnswers: string[]
  contribution: string
  photo: string | null
  link: string
  teamIdx: number
  hostYes: string[]
  seen: Record<string, string[]>
  notes: Record<string, string>
  myYes: boolean | null
  recap: Recap | null
  recapErr: boolean
  booked: string | null
  attach: boolean
  copied: boolean
}

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
  const { cards, talents, me, go, livePeople } = useStore()
  const table = cards.find((c) => c.id === tableId)!
  const isTeam = table.format === 'team'
  const sessionCount = isTeam && (table.teamTasks?.length ?? 0) > 1 ? table.teamTasks!.length : 1
  const [session, setSession] = useState(1)
  const [sessionSnapshots, setSessionSnapshots] = useState<Record<number, SessionSnapshot>>({})
  const [completedSessions, setCompletedSessions] = useState<Record<number, boolean>>({})
  const [sessionsPaused, setSessionsPaused] = useState(false)
  const round = session - 1
  // Real people registered on the shared event (codes T-200+); everyone else is the synthetic crowd.
  const isRealCode = useCallback((c: string) => livePeople.some((p) => p.code === c), [livePeople])
  const tableKey = as === 'company' ? tableKeys()[tableId] : undefined
  const person = as === 'talent' ? myPerson() : null
  const liveTable = Boolean((table as { live?: boolean }).live)
  const allocation = useMemo(() => allocate(cards, talents), [cards, talents])
  useEffect(() => {
    if (as !== 'talent') return
    const assigned = allocation.seats.find((s) => s.table === table.id && s.talent === me.code)
    if (assigned) setSession(Math.min(sessionCount, assigned.round + 1))
  }, [as, allocation, me.code, sessionCount, table.id])
  const seated = useMemo(() => {
    // One session: the demo shows one round, plus real people from whichever round the lottery gave them.
    const seats = allocation.seats.filter((s) => s.table === table.id && (s.round === round || (sessionCount === 1 && isRealCode(s.talent))))
    const codes = seats.map((s) => s.talent).filter((c) => c !== me.code)
    // a freshly published table has no lottery seats yet — fill it for the demo
    const pad = talents.map((t) => t.code).filter((c) => c !== me.code && !codes.includes(c) && !c.startsWith('T-2'))
    const realFirst = [...codes].sort((a, b) => Number(isRealCode(b)) - Number(isRealCode(a)))
    return [...(as === 'talent' ? [me.code] : []), ...realFirst, ...pad].slice(0, table.seatsPerRound)
  }, [allocation, talents, me.code, table, as, isRealCode, round, sessionCount])

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
  const questions = useMemo(() => table.debriefQuestions?.length ? table.debriefQuestions : ['How did you approach it?', 'What would you do next?', 'What would you need from us?'], [table.debriefQuestions])
  const answers = SESSION_ANSWERS[key]?.[round] ?? ANSWERS[key]

  // Live data from the other device, polled every 3 seconds.
  const [serverTable, setServerTable] = useState<Awaited<ReturnType<typeof live.table>> | null>(null)
  const [serverMe, setServerMe] = useState<Awaited<ReturnType<typeof live.me>> | null>(null)
  const [pollTick, setPollTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPollTick((x) => x + 1), 3000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (tableKey) live.table(tableId, tableKey).then(setServerTable).catch(() => {})
    if (person && liveTable) live.me(person.token).then(setServerMe).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollTick, tableKey, tableId, liveTable])

  // Company perspective: host picks. Real people answer from their own phones; the synthetic crowd is simulated.
  const [hostYes, setHostYes] = useState<string[]>([])
  const talentYes = useMemo(
    () => new Set([...seated.filter((c, i) => !isRealCode(c) && i % 2 === 0), ...(serverTable?.talentYes ?? [])]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seated, serverTable],
  )
  // Talent perspective: on a live table the company decides on its own device; demo tables simulate a yes.
  const [myYes, setMyYes] = useState<boolean | null>(null)
  const companyAgreed = liveTable ? Boolean(serverMe?.matches.some((m) => m.table === table.id)) : true
  const matchedCodes = as === 'company' ? hostYes.filter((c) => talentYes.has(c)) : myYes && companyAgreed ? [me.code] : []
  const waitingForCompany = as === 'talent' && myYes === true && !companyAgreed
  const realDebrief = (c: string) => serverTable?.debriefs.find((d) => d.code === c)
  const realName = (c: string) => serverTable?.matches.find((m) => m.code === c)?.name
  const liveNote = serverMe?.matches.find((m) => m.table === table.id)?.note ?? null

  const allocatedTeams = isTeam
    ? [0, 1, 2].map((team) =>
        allocation.seats
          .filter((s) => s.table === table.id && s.round === round && s.team === team)
          .map((s) => s.talent)
          .filter((c) => seated.includes(c)),
      )
    : [seated]
  const fallbackTeams = [0, 1, 2].map((team) => seated.filter((_, index) => (index % 3 + round * Math.floor(index / 3)) % 3 === team))
  const teams = isTeam && sessionCount > 1 && allocatedTeams.some((team) => team.length) ? allocatedTeams : isTeam ? fallbackTeams : [seated]
  const activeTeamTask = isTeam ? table.teamTasks?.at(Math.min(round, (table.teamTasks?.length ?? 1) - 1)) : undefined
  const partOf = (j: number) => activeTeamTask?.parts?.at(j % 4)?.split(':')[0] ?? (table.teamTasks?.length ? `Session ${session} part ${j + 1}` : table.parts?.at(j % 4)?.split(':')[0] ?? `Part ${j + 1}`)
  const simLine = (c: string) => {
    if (isRealCode(c)) return realDebrief(c)?.contribution || 'Still writing their answers…'
    const position = seated.indexOf(c)
    const j = position % 4
    const sessionLines = SESSION_SIM_LINES[demoKey]?.[round]
    if (sessionLines?.[position]) return sessionLines[position]
    const legacyLine = SIM_LINES[demoKey]?.at(j)
    if (legacyLine) return legacyLine
    const focus = (activeTeamTask?.title ?? table.title).replace(/[.!?]+$/, '').toLowerCase()
    return `${GENERIC_SESSION_ACTIONS[round % GENERIC_SESSION_ACTIONS.length][position % 12]} “${focus}”.`
  }
  const teamOutput =
    SESSION_TEAM_OUTPUT[demoKey]?.[round] ??
    (round === 0 ? TEAM_OUTPUT[demoKey] ?? table.teamResult : undefined) ??
    `Handover for “${activeTeamTask?.title ?? table.title}”: the team agreed on a practical next step and how to check it.`
  const exampleContribution = SESSION_CONTRIB[key]?.[round] ?? CONTRIB[key]

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
  useEffect(() => {
    const saved = sessionSnapshots[session]
    if (saved) {
      setPhase(saved.phase)
      setSecs(saved.secs)
      setRunning(false)
      setMyAnswers(saved.myAnswers)
      setContribution(saved.contribution)
      setPhoto(saved.photo)
      setLink(saved.link)
      setTeamIdx(saved.teamIdx)
      setHostYes(saved.hostYes)
      setSeen(saved.seen)
      setNotes(saved.notes)
      setMyYes(saved.myYes)
      setRecap(saved.recap)
      setRecapErr(saved.recapErr)
      setBooked(saved.booked)
      setAttach(saved.attach)
      setCopied(saved.copied)
      return
    }
    setPhase(0)
    setSecs(EVENT.sprintMinutes * 60)
    setRunning(false)
    setMyAnswers(questions.map(() => ''))
    setContribution('')
    setPhoto(null)
    setLink('')
    setTeamIdx(0)
    setHostYes([])
    setSeen({})
    setNotes({})
    setMyYes(null)
    setRecap(null)
    setRecapErr(false)
    setBooked(null)
    setAttach(false)
    setCopied(false)
    // Question data may be refreshed by live polling; that must not reset the active session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionSnapshots])
  const snapshot = (): SessionSnapshot => ({
    phase,
    secs,
    myAnswers,
    contribution,
    photo,
    link,
    teamIdx,
    hostYes,
    seen,
    notes,
    myYes,
    recap,
    recapErr,
    booked,
    attach,
    copied,
  })
  const switchSession = (next: number, forceNext = false) => {
    if (next === session || next < 1 || next > sessionCount) return
    const goingForward = next > session
    if (goingForward && !forceNext && (next !== session + 1 || !completedSessions[session])) return
    setSessionSnapshots((all) => ({ ...all, [session]: snapshot() }))
    setSessionsPaused(false)
    setSession(next)
  }
  const finishSession = () => {
    if (session < sessionCount) {
      setCompletedSessions((done) => ({ ...done, [session]: true }))
      setSessionsPaused(false)
      switchSession(session + 1, true)
    } else {
      setPhase(2)
    }
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')

  return (
    <div className="space-y-8">
      {sessionCount > 1 && (
        <section className="card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-extrabold">Team sessions</div>
              <p className="text-lg text-ink/70">Each session has a new task and a reshuffled team.</p>
            </div>
            <div className="font-bold text-brand">Session {session} of {sessionCount}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: sessionCount }, (_, i) => {
              const task = table.teamTasks?.at(i)
              return (
                <button
                  key={i}
                  disabled={i + 1 > session && !completedSessions[i]}
                  className={`rounded-2xl px-4 py-3 text-left transition ${session === i + 1 ? 'bg-brand text-white' : 'bg-paper text-ink hover:bg-brand-soft'}`}
                  onClick={() => switchSession(i + 1)}
                >
                  <span className="block font-bold">Session {i + 1}</span>
                  <span className="block max-w-56 truncate text-sm opacity-80">{task?.title ?? `Team task ${i + 1}`}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}
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
            <div className="text-lg font-bold text-brand">{activeTeamTask?.title ?? 'The task'}</div>
            <p className="mt-1 text-xl">{activeTeamTask?.instructions ?? table.atTheTable}</p>
            {table.individualChallenge && round === 0 && (
              <p className="mt-4 border-t border-brand/15 pt-4 text-lg">
                <span className="font-bold">Before the team session: </span>{table.individualChallenge.instructions}
              </p>
            )}
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
                setContribution(exampleContribution)
              }}
            >
              Use example answers
            </button>
            <button
              className="btn-primary px-7 text-lg"
              disabled={!talentReady}
              onClick={() => {
                if (person) live.debrief({ table: table.id, token: person.token, answers: myAnswers, contribution, link }).catch(() => {})
                finishSession()
              }}
            >
              {session < sessionCount ? 'Next session' : 'Next: would you like to continue?'} <ArrowRight size={20} />
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
              {teamOutput ?? table.teamResult ?? TEAM_OUTPUT.default}
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
              {session < sessionCount && sessionsPaused ? (
                <div className="rounded-2xl bg-brand-soft p-4 text-lg">
                  <div className="font-bold text-brand">Sessions paused after session {session}.</div>
                  <button className="btn-primary mt-3" onClick={finishSession}>
                    <ArrowRight size={20} /> Resume session {session + 1}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    className="btn-primary px-7 text-lg"
                    onClick={() => {
                      if (tableKey)
                        seated.filter(isRealCode).forEach((c) => live.note({ table: tableId, code: c, token: tableKey, seen: seen[c] ?? [], note: notes[c] ?? '' }).catch(() => {}))
                      finishSession()
                    }}
                  >
                    {session < sessionCount ? 'Next session' : 'Next: would you like to continue?'} <ArrowRight size={20} />
                  </button>
                  {session < sessionCount && <button className="btn-ghost" onClick={() => setSessionsPaused(true)}>Pause after this session</button>}
                </>
              )}
          </div>
        </section>
      )}

      {phase === 2 && (
        <section className="pop grid items-center gap-10 md:grid-cols-[340px_1fr]">
          {as === 'talent' ? (
            <Phone title={`Continue with ${table.company}?`}>
              <div className="space-y-3">
                <button className={`btn w-full py-4 text-xl ${myYes ? 'bg-mint text-white' : 'bg-brand text-white hover:bg-brand-deep'}`} onClick={() => {
                    setMyYes(true)
                    if (person) live.decide(table.id, me.code, true, person.token).catch(() => {})
                  }}>
                  <Heart size={22} /> Yes
                </button>
                <button className={`btn w-full py-4 text-xl ${myYes === false ? 'bg-ink text-white' : 'bg-ink/6'}`} onClick={() => {
                    setMyYes(false)
                    if (person) live.decide(table.id, me.code, false, person.token).catch(() => {})
                  }}>
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
                    onClick={() => {
                      const yes = !hostYes.includes(c)
                      setHostYes((h) => (yes ? [...h, c] : h.filter((x) => x !== c)))
                      if (tableKey && isRealCode(c)) live.decide(tableId, c, yes, tableKey).catch(() => {})
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-lg transition ${hostYes.includes(c) ? 'border-brand bg-brand-soft' : 'border-ink/10'}`}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      {c}
                      {isRealCode(c) && <span className="h-2.5 w-2.5 rounded-full bg-mint" title="A real person on another device" />}
                    </span>
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
              {matchedCodes.length ? `See ${matchedCodes.length} mutual match${matchedCodes.length > 1 ? 'es' : ''}` : waitingForCompany ? `Waiting for ${table.company}…` : as === 'talent' ? 'Tap “Yes” first' : 'Tap the people you’d like to meet'} <ArrowRight size={20} />
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
                <div className="font-display text-2xl font-extrabold">{as === 'company' ? (realName(matchedCodes[0]) ?? NAMES[seated.indexOf(matchedCodes[0])] ?? 'Amira K.') : (person?.name ?? 'Amira K.')}</div>
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
                  (teamOutput ?? table.teamResult ?? TEAM_OUTPUT.default)
                )}
              </div>
              <div>
                <div className="font-bold">Their answers</div>
                <ul className="mt-1 space-y-1.5">
                  {(as === 'talent' ? myAnswers : (realDebrief(matchedCodes[0])?.answers ?? answers)).map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3 rounded-3xl bg-brand-soft p-5">
                <div className="font-bold text-brand">The host noticed</div>
                {(as === 'company' ? seen[matchedCodes[0]] : liveNote?.seen)?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {(as === 'company' ? seen[matchedCodes[0]] : liveNote!.seen).map((b) => (
                      <span key={b} className="chip bg-mint text-white">
                        <Check size={16} /> {b}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div>“{(as === 'company' ? notes[matchedCodes[0]] : liveNote?.note) || (liveTable ? 'The host left no note.' : HOST_NOTE[key])}”</div>
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
                      setRecap(
                        await post<Recap>('/api/recap', {
                          cardTitle: table.title,
                          problem: table.problem,
                          debrief: questions.map((q, i) => `Q: ${q}\nA: ${(as === 'talent' ? myAnswers : (realDebrief(matchedCodes[0])?.answers ?? answers)).at(i) ?? ''}`).join('\n'),
                          companyNote: (as === 'company' && notes[matchedCodes[0]]) || HOST_NOTE[key],
                          talentNote: as === 'talent' ? `${contribution} ${TALENT_NOTE[key]}` : `${simLine(matchedCodes[0])} ${TALENT_NOTE[key]}`,
                          promise: (table.followUp || '').replace(' if it’s mutual', ''),
                          booked: booked ?? '',
                        }),
                      )
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
                  {recap.common_ground.length > 0 && (
                    <div>
                      <div className="font-bold">You both talked about</div>
                      {recap.common_ground.map((x) => (
                        <div key={x}>• {x}</div>
                      ))}
                    </div>
                  )}
                  {recap.open_questions.length > 0 && (
                    <div>
                      <div className="font-bold">To clarify next time</div>
                      {recap.open_questions.map((x) => (
                        <div key={x}>• {x}</div>
                      ))}
                    </div>
                  )}
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
