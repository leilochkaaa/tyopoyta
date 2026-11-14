import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { TEMPLATES } from '../lib/templates'
import { FormatBadge } from './ChallengeCardView'

type Template = (typeof TEMPLATES)[number]

export default function TaskLibrary({ onPick }: { onPick: (t: Template) => void }) {
  const sectors = ['All', ...new Set(TEMPLATES.map((t) => t.sector))]
  const [sector, setSector] = useState('All')
  const shown = TEMPLATES.filter((t) => sector === 'All' || t.sector === sector)
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {sectors.map((s) => (
          <button key={s} onClick={() => setSector(s)} className={`chip px-4 py-2 text-base ${sector === s ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15'}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {shown.map((t) => (
          <article key={t.id} className="card flex flex-col gap-3 p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-bold text-ink/70">{t.sector}</span>
              <FormatBadge format={t.format} />
            </div>
            <h3 className="text-2xl font-extrabold leading-tight">{t.title}</h3>
            <p className="flex-1 text-lg text-ink/75">{t.atTheTable}</p>
            <button className="btn-primary self-start" onClick={() => onPick(t)}>
              Use this task <ArrowRight size={20} />
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
