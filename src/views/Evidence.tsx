import { ExternalLink } from 'lucide-react'

// Every number on this page is sourced; see junction/research/evidence.md.

function Src({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-ink/60 underline-offset-2 hover:text-brand hover:underline">
      {children} <ExternalLink size={14} />
    </a>
  )
}

function Stat({ big, label, src, href }: { big: string; label: React.ReactNode; src: string; href: string }) {
  return (
    <div className="card flex flex-col gap-3 p-6">
      <div className="font-display text-5xl font-extrabold text-brand md:text-6xl">{big}</div>
      <div className="flex-1 text-lg">{label}</div>
      <Src href={href}>{src}</Src>
    </div>
  )
}

const VALIDITY = [
  { m: 'Structured interview', v: 0.42, ours: true },
  { m: 'Work sample', v: 0.33, ours: true },
  { m: 'Years of education*', v: 0.1 },
  { m: 'Years of experience', v: 0.07 },
]

export default function EvidenceView() {
  return (
    <div className="space-y-14">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Espoo has the talent. The CV hides it.</h1>
        <p className="mt-3 text-xl text-ink/75">Every number links to its source.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Stat
          big="18.3%"
          label={<>unemployment for Espoo residents born abroad, vs <b>7.7%</b> for those born in Finland.</>}
          src="Statistics Finland, 2024"
          href="https://kototietokanta.stat.fi/PXWeb/pxweb/en/Kotoutumisenindikaattorit/"
        />
        <Stat
          big="3×"
          label={<>fewer interview calls with an Iraqi name (13.4%) than a Finnish name (39%) on the same CV.</>}
          src="Ahmad 2020, via Yle"
          href="https://yle.fi/news/3-12198076"
        />
        <Stat
          big="81%"
          label="of UK recruiters say AI made CVs more alike and less distinctive."
          src="CV-Library, Apr 2026"
          href="https://onrec.com/news/news-archive/ai-is-standardising-cvs-and-reshaping-hiring-decisions-according-to-research"
        />
      </div>

      <section className="card space-y-5 p-6 md:p-8">
        <h2 className="text-3xl font-extrabold">What predicts doing the job well</h2>
        {VALIDITY.map(({ m, v, ours }) => (
          <div key={m} className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="w-full text-lg font-semibold sm:w-60">
              {m} {ours && <span className="chip ml-1 bg-brand-soft text-brand">in työpöytä</span>}
            </div>
            <div className="h-9 flex-1 overflow-hidden rounded-xl bg-ink/6">
              <div className={`flex h-full items-center justify-end rounded-xl pr-3 font-bold ${ours ? 'bg-brand text-white' : 'bg-ink/20'}`} style={{ width: `${(v / 0.45) * 100}%` }}>
                .{String(Math.round(v * 100)).padStart(2, '0')}
              </div>
            </div>
          </div>
        ))}
        <p className="text-lg text-ink/75">A CV shows the two weakest signals. A sprint uses the two strongest.</p>
        <Src href="https://doi.org/10.1037/apl0000994">Sackett et al. 2022 · *education: Schmidt &amp; Hunter 1998</Src>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <Stat
          big="+7 pp"
          label="more hires for foreign-name applicants when Helsinki hid names, with no drop in pay or tenure."
          src="Kanninen & Virkola, VATT 2023"
          href="https://labore.fi/wp-content/uploads/2023/09/Anonyymi-rekrytointi-kalvot-12092023.pdf"
        />
        <div className="card flex flex-col gap-3 bg-ink p-6 text-white">
          <div className="font-display text-5xl font-extrabold text-berry md:text-6xl">0</div>
          <div className="text-lg">Finnish recruitment events we found that publish how many people they got hired. työpöytä counts every match.</div>
        </div>
      </div>
    </div>
  )
}
