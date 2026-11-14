import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { ReactNode } from 'react'

export function Stepper({ steps, current, onJump }: { steps: string[]; current: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="flex shrink-0 items-center gap-2">
            <button
              disabled={!done}
              onClick={() => onJump(i)}
              className={`flex items-center gap-2 rounded-full py-1 pl-1 font-semibold transition ${active ? 'bg-brand pr-4 text-white' : done ? 'pr-1 text-mint hover:brightness-95 md:pr-3' : 'pr-1 text-ink/60 md:pr-3'}`}
            >
              <span className={`grid h-8 w-8 place-items-center rounded-full font-bold ${active ? 'bg-white text-brand' : done ? 'bg-mint text-white' : 'bg-ink/8'}`}>
                {done ? <Check size={16} /> : i + 1}
              </span>
              <span className={active ? '' : 'hidden md:inline'}>{s}</span>
            </button>
            {i < steps.length - 1 && <span className={`h-0.5 w-5 rounded ${done ? 'bg-mint' : 'bg-ink/10'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

export function StepHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-3xl" data-step={eyebrow}>
      <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">{title}</h1>
      {children && <p className="mt-3 text-xl text-ink/75">{children}</p>}
    </div>
  )
}

// Sticky bottom bar: one obvious next action.
export function NavBar({
  onBack,
  onNext,
  nextLabel = 'Next',
  disabled,
  hint,
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  disabled?: boolean
  hint?: string
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-10 border-t border-ink/8 bg-paper/95 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button className="btn-ghost" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <span />
        )}
        <span className="flex-1 text-right font-semibold text-ink/70">{disabled && hint}</span>
        {onNext && (
          <button className="btn-primary px-7 text-lg" onClick={onNext} disabled={disabled}>
            {nextLabel} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
