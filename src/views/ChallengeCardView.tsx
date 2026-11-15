import { Sparkles, CalendarCheck, MapPin, UsersRound, Video, Check, Clock, Hammer, Lightbulb, Languages, MessageCircleQuestion, ShieldAlert, UserRound } from 'lucide-react'
import type { ChallengeCard } from '../lib/types'
import { TEAM_PLAN } from '../lib/data'

export function FormatBadge({ format }: { format: ChallengeCard['format'] }) {
  if (format === 'team')
    return (
      <span className="chip bg-ink text-white">
        <UsersRound size={16} /> Team sprint
      </span>
    )
  return format === 'sprint' ? (
    <span className="chip bg-brand-soft text-brand">
      <Lightbulb size={16} /> Problem sprint
    </span>
  ) : (
    <span className="chip bg-berry-soft text-ink">
      <Hammer size={16} /> Work taster
    </span>
  )
}

const WHERE = { onsite: { icon: MapPin, label: 'In person' }, online: { icon: Video, label: 'Online' }, both: { icon: Video, label: 'In person or online' } }

export function WhereLine({ where }: { where: ChallengeCard['where'] }) {
  const w = WHERE[where ?? 'onsite']
  return (
    <div className="flex items-center gap-2 text-ink/70">
      <w.icon size={18} /> {w.label}
    </div>
  )
}

export default function ChallengeCardView({
  card,
  compact,
  selected,
  onSelect,
  rank,
  fit,
}: {
  card: ChallengeCard
  compact?: boolean
  selected?: boolean
  onSelect?: () => void
  rank?: number
  fit?: string[]
}) {
  const host = card.host.replace(/^[A-Z](?=[a-z])/, (m) => m.toLowerCase())
  return (
    <article
      onClick={onSelect}
      className={`card relative flex flex-col gap-4 p-6 text-left transition ${onSelect ? 'cursor-pointer hover:ring-2 hover:ring-brand/40' : ''} ${selected ? 'ring-[3px] ring-brand hover:ring-brand' : ''}`}
    >
      {rank != null && (
        <span className="pop absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full bg-brand text-lg font-bold text-white">{rank}</span>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-lg font-bold">{card.company}</span>
        <FormatBadge format={card.format} />
      </div>
      <h3 className="text-2xl font-extrabold leading-tight">{card.title}</h3>
      {fit && fit.length > 0 && (
        <div className="flex items-start gap-2 rounded-2xl bg-berry-soft px-4 py-2.5 font-semibold text-ink">
          <Sparkles size={18} className="mt-1 shrink-0 text-brand" /> Uses your skills: {fit.join(', ')}
        </div>
      )}
      <p className="text-lg text-ink/75">{card.problem}</p>
      {!compact && (
        <>
          <div className="rounded-2xl bg-brand-soft p-4 text-lg">
            <div className="mb-1 flex items-center gap-2 font-bold text-brand">
              <Clock size={18} /> At the table, 20 min
            </div>
            {card.atTheTable}
          </div>
          {card.individualChallenge && (
            <div className="rounded-2xl bg-berry-soft p-4 text-lg">
              <div className="mb-1 font-bold text-brand">Individual challenge</div>
              <div className="font-semibold">{card.individualChallenge.title}</div>
              <p>{card.individualChallenge.instructions}</p>
            </div>
          )}
          {card.format === 'team' && (card.teamTasks?.length ?? 0) > 1 ? (
            <div>
              <div className="mb-2 text-lg font-bold">Team sessions · 20 min each</div>
              <ol className="space-y-2">
                {card.teamTasks!.map((task, i) => (
                  <li key={`${task.title}-${i}`} className="rounded-2xl bg-paper p-3 text-lg">
                    <span className="font-bold text-brand">Session {i + 1}: {task.title}</span>
                    <p>{task.instructions}</p>
                    {task.parts?.length ? (
                      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                        {task.parts.map((part, partIndex) => (
                          <li key={part} className="rounded-xl bg-white p-2 text-base">
                            <span className="font-bold">{partIndex + 1}.</span> {part}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {task.teamResult && <p className="mt-2 text-base"><span className="font-bold">Handover:</span> {task.teamResult}</p>}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {card.format === 'team' && <TeamPlan />}
          {card.format === 'team' && card.parts?.length && (card.teamTasks?.length ?? 0) <= 1 ? <TeamParts card={card} /> : null}
          <div>
            <div className="mb-2 text-lg font-bold">What good looks like</div>
            <ul className="space-y-1.5 text-lg">
              {card.goodLooksLike.map((g) => (
                <li key={g} className="flex gap-2">
                  <Check size={20} className="mt-1 shrink-0 text-mint" /> {g}
                </li>
              ))}
            </ul>
          </div>
          {card.debriefQuestions?.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-lg font-bold">
                <MessageCircleQuestion size={20} /> Afterwards, everyone gets the same 3 questions
              </div>
              <ol className="list-inside list-decimal space-y-1 text-lg text-ink/80">
                {card.debriefQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </div>
          )}
          <div className="space-y-2 text-ink/75">
            <WhereLine where={card.where} />
            <div className="flex items-center gap-2">
              <Languages size={18} /> {card.languages.join(', ')}
            </div>
            {card.mustHaves.length > 0 && (
              <div className="flex items-start gap-2">
                <ShieldAlert size={18} className="mt-1 shrink-0" /> {card.mustHaves.join(', ')}
              </div>
            )}
            <div className="flex items-center gap-2">
              <UserRound size={18} /> Hosted by the {host}
            </div>
            <div className="font-semibold text-ink">🎁 {card.whatYouGet}</div>
          </div>
        </>
      )}
      {compact && (
        <div className="space-y-1">
          <WhereLine where={card.where} />
          <div className="flex items-center gap-2 text-ink/70">
            <Languages size={18} /> {card.languages.join(', ')}
          </div>
        </div>
      )}
      {card.followUp && (
        <div className="mt-auto flex items-start gap-2 rounded-2xl bg-mint-soft px-4 py-3 font-semibold text-mint">
          <CalendarCheck size={20} className="mt-0.5 shrink-0" /> {card.followUp}
        </div>
      )}
    </article>
  )
}

// Same structure for every team, so quiet people and non-native speakers get the same floor time.
export function TeamPlan() {
  return (
    <div>
      <div className="mb-2 text-lg font-bold">How the team works</div>
      <ol className="space-y-2">
        {TEAM_PLAN.map((s) => (
          <li key={s.what} className="flex items-start gap-3 text-lg">
            <span className="w-16 shrink-0 font-display font-extrabold text-brand">{s.min} min</span> {s.what}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function TeamParts({ card }: { card: ChallengeCard }) {
  return (
    <div>
      <div className="mb-2 text-lg font-bold">Four parts, one per person</div>
      <ol className="grid gap-2 sm:grid-cols-2">
        {card.parts!.map((p, i) => (
          <li key={p} className="flex gap-3 rounded-2xl bg-paper p-3 text-lg">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-berry font-bold">{i + 1}</span> {p}
          </li>
        ))}
      </ol>
      {card.teamResult && (
        <p className="mt-3 text-lg">
          <span className="font-bold">Together you hand over:</span> {card.teamResult}
        </p>
      )}
    </div>
  )
}
