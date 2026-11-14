import { ArrowLeftRight, BarChart3, Building2, LayoutDashboard, ShieldCheck, UserRound } from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import HomeView from './views/Home'
import CompanyView from './views/Company'
import TalentView from './views/Talent'
import OrganizerView from './views/Organizer'
import TrustView from './views/Trust'
import EvidenceView from './views/Evidence'
import Tour from './views/Tour'
import { Logo } from './views/Logo'

const ROLE = {
  talent: { label: 'Job seeker', icon: UserRound },
  company: { label: 'Company', icon: Building2 },
  organizer: { label: 'Organiser', icon: LayoutDashboard },
}

function Shell() {
  const { view, go, aiMode } = useStore()
  const Page = { welcome: HomeView, company: CompanyView, talent: TalentView, organizer: OrganizerView, trust: TrustView, evidence: EvidenceView }[view]
  const role = view in ROLE ? ROLE[view as keyof typeof ROLE] : null
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:gap-4">
          <button onClick={() => go('welcome')} aria-label="työpöytä home">
            <Logo />
          </button>
          {role && (
            <button onClick={() => go('welcome')} className="chip whitespace-nowrap bg-white text-ink ring-1 ring-ink/10 hover:ring-ink/25" title="Switch role">
              <role.icon size={16} /> <span className="hidden sm:inline">{role.label}</span>
              <ArrowLeftRight size={14} className="opacity-50" />
            </button>
          )}
          <div className="flex-1" />
          <nav className="hidden items-center gap-5 font-semibold text-ink/70 sm:flex">
            <button onClick={() => go('evidence')} className="flex items-center gap-1.5 hover:text-ink">
              <BarChart3 size={17} /> Evidence
            </button>
            <button onClick={() => go('trust')} className="flex items-center gap-1.5 hover:text-ink">
              <ShieldCheck size={17} /> Privacy & AI
            </button>
          </nav>
          <span
            title={aiMode === 'live' ? 'Connected to Claude' : 'Scripted demo answers (no API key)'}
            className={`chip shrink-0 ${aiMode === 'live' ? 'bg-mint-soft text-mint' : 'bg-berry-soft text-ink'}`}
          >
            <span className={`h-2 w-2 rounded-full ${aiMode === 'live' ? 'bg-mint' : 'bg-berry'}`} />
            AI {aiMode}
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Page />
      </main>
      <Tour />
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-ink/60">
        Demo for the City of Espoo challenge, Junction 2026. All people and companies are made up.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
