import { ArrowRight, Building2, Compass, LayoutDashboard, UserRound } from 'lucide-react'
import { useStore, type View } from '../lib/store'
import { EVENT } from '../lib/data'

const ROLES: { view: View; icon: typeof Building2; title: string; body: string }[] = [
  { view: 'talent', icon: UserRound, title: 'I’m looking for work', body: 'No CV needed' },
  { view: 'company', icon: Building2, title: 'I’m hiring', body: 'Bring a challenge, not a booth' },
  { view: 'organizer', icon: LayoutDashboard, title: 'I run the event', body: 'City of Espoo, password needed' },
]

// Seats around the table: five job seekers and the host.
const SEATS = [0, 60, 120, 180, 240, 300]

function TableScene() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {SEATS.map((a, i) => (
        <span
          key={a}
          className={`absolute grid h-[17%] w-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${i === 0 ? 'bg-ink text-white' : 'bg-berry text-ink'}`}
          style={{ left: `${50 + 44 * Math.sin((a * Math.PI) / 180)}%`, top: `${50 - 44 * Math.cos((a * Math.PI) / 180)}%` }}
        >
          {i === 0 ? <Building2 size={26} /> : <UserRound size={26} />}
        </span>
      ))}
      <div className="absolute inset-[17%] grid place-items-center rounded-full bg-brand p-[12%] text-center text-white">
        <p className="font-display text-xl font-extrabold leading-tight md:text-2xl">“Our test pipeline takes 3 hours. Help us cut it.”</p>
      </div>
    </div>
  )
}

export default function HomeView() {
  const { go, setTour } = useStore()
  return (
    <div className="grid items-center gap-12 pt-2 md:grid-cols-[1.1fr_1fr] md:pt-8">
      <section>
        <p className="text-lg font-semibold text-brand">
          {EVENT.date} · {EVENT.place}
        </p>
        <h1 className="mt-3 text-5xl font-extrabold leading-[1.02] md:text-7xl">Meet over a real problem, not a CV.</h1>
        <p className="mt-5 max-w-xl text-xl text-ink/75">Solve a company’s real task for 20 minutes, in person or online. If you both want more, you meet again.</p>

        <h2 className="mt-10 text-2xl font-extrabold">Who are you?</h2>
        <div className="mt-4 space-y-3">
          {ROLES.map(({ view, icon: Icon, title, body }) => (
            <button
              key={view}
              onClick={() => go(view)}
              className="group flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left ring-1 ring-ink/8 transition hover:ring-2 hover:ring-brand"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon size={26} />
              </span>
              <span className="flex-1">
                <span className="block text-xl font-bold">{title}</span>
                <span className="block text-ink/65">{body}</span>
              </span>
              <ArrowRight size={24} className="text-brand transition group-hover:translate-x-1" />
            </button>
          ))}
        </div>

        <button className="mt-6 flex items-center gap-2 font-semibold text-ink/70 hover:text-ink" onClick={() => setTour(true)}>
          <Compass size={20} /> First time here? Take the 3-minute tour
        </button>
      </section>

      <TableScene />
    </div>
  )
}
