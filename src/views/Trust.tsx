import { Ban, Check, Database } from 'lucide-react'

const AI_DOES = ['Turns a company’s answers into a task card', 'Names skills from your own words, with the quote', 'Writes one shared summary for both sides']
const NEVER = ['Scores, ranks or filters people', 'Decides who gets a seat', 'Reads CVs or photos', 'Analyses voice or emotion']
const DATA = ['A code instead of your name until you both say yes', 'Text only, never voice recordings', 'Deleted after 30 days']

export default function TrustView() {
  return (
    <div className="space-y-10">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">AI helps people describe. People decide.</h1>
        <p className="mt-3 text-xl text-ink/75">Every decision about a person is made by a person.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-3xl font-extrabold">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-mint-soft text-mint">
              <Check size={24} />
            </span>
            AI does
          </h2>
          <ul className="mt-5 space-y-4 text-xl">
            {AI_DOES.map((t) => (
              <li key={t} className="flex gap-3">
                <Check size={24} className="mt-0.5 shrink-0 text-mint" /> {t}
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-6 md:p-8">
          <h2 className="flex items-center gap-3 text-3xl font-extrabold">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-soft text-rose">
              <Ban size={24} />
            </span>
            AI never
          </h2>
          <ul className="mt-5 space-y-4 text-xl">
            {NEVER.map((t) => (
              <li key={t} className="flex gap-3">
                <Ban size={24} className="mt-0.5 shrink-0 text-rose" /> {t}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-6 md:p-8">
        <h2 className="flex items-center gap-3 text-2xl font-extrabold">
          <Database size={24} className="text-brand" /> Your data
        </h2>
        <ul className="mt-4 grid gap-4 text-lg md:grid-cols-3">
          {DATA.map((t) => (
            <li key={t} className="rounded-2xl bg-brand-soft p-5 font-semibold">
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-brand p-6 text-white md:p-8">
        <h2 className="text-2xl font-extrabold">EU AI Act</h2>
        <p className="mt-2 max-w-3xl text-lg text-white/90">
          AI that selects or evaluates candidates is high-risk from 2 Dec 2027. työpöytä’s AI does neither, and we still follow the high-risk rules: logging, transparency, human oversight.
        </p>
      </section>
    </div>
  )
}
