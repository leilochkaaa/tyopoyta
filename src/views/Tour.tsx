import { ArrowRight, Compass, X } from 'lucide-react'
import { useStore, type View } from '../lib/store'

// Guided demo for judges: what to click on each screen, then where to go next.
const STOPS: { view: View; title: string; body: string; next?: View; nextLabel?: string }[] = [
  { view: 'welcome', title: 'Three roles', body: 'We start with a small company that has no HR team.', next: 'company', nextLabel: 'Company' },
  { view: 'company', title: 'A company in 5 minutes', body: 'Tap “Use example answer” 3 times, then publish.', next: 'talent', nextLabel: 'Job seeker' },
  { view: 'talent', title: 'Amira, no “relevant” CV', body: 'Tap “Demo: answer as Amira”, then pick tables.', next: 'organizer', nextLabel: 'Organiser' },
  { view: 'organizer', title: 'The City of Espoo view', body: 'Try “Invite companies”, then run the lottery.', next: 'evidence', nextLabel: 'Evidence' },
  { view: 'evidence', title: 'Why it works', body: 'Every number links to its source.', next: 'trust', nextLabel: 'Privacy & AI' },
  { view: 'trust', title: 'Responsible by design', body: 'AI never scores or decides. That’s the tour!' },
]

export default function Tour() {
  const { view, go, tour, setTour } = useStore()
  if (!tour) return null
  const i = STOPS.findIndex((s) => s.view === view)
  const stop = STOPS[i]
  if (!stop) return null
  return (
    <div className="pop fixed bottom-24 left-4 z-40 w-[min(400px,calc(100vw-2rem))] rounded-3xl bg-ink p-6 text-white shadow-2xl">
      <div className="flex items-center gap-2">
        <Compass size={20} className="text-berry" />
        <span className="font-semibold text-white/70">
          Tour {i + 1} of {STOPS.length}
        </span>
        <button className="ml-auto rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" onClick={() => setTour(false)} title="Close tour" aria-label="Close tour">
          <X size={20} />
        </button>
      </div>
      <div className="mt-3 font-display text-2xl font-extrabold">{stop.title}</div>
      <p className="mt-1 text-lg text-white/85">{stop.body}</p>
      {stop.next ? (
        <button className="btn mt-5 w-full bg-berry text-ink hover:brightness-95" onClick={() => go(stop.next!)}>
          Next: {stop.nextLabel} <ArrowRight size={20} />
        </button>
      ) : (
        <button className="btn mt-5 w-full bg-white/15 text-white" onClick={() => setTour(false)}>
          Finish
        </button>
      )}
    </div>
  )
}
