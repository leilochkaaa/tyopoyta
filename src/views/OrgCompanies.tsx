import { useEffect, useMemo, useState } from 'react'
import { Lock, Plus, Search, Trash2 } from 'lucide-react'

export const STAGES = ['Idea', 'Invited', 'Interested', 'Challenge ready', 'Attended', 'Hired someone', 'Not now'] as const
type Stage = (typeof STAGES)[number]

export interface Prospect {
  id: string
  name: string
  sector: string
  contact: string
  email: string
  status: Stage
  nextStep: string
  nextDate: string
  notes: string
  source: string
  roles: number
  updatedAt: string
}

const TOKEN_KEY = 'tp-org-token'
export const readToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
const writeToken = (t: string | null) => {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // private mode: the token just lives in memory
  }
}

export function OrgLogin({ onToken }: { onToken: (t: string) => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [demoHint, setDemoHint] = useState(false)
  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((j) => setDemoHint(Boolean(j.orgDemoPassword))).catch(() => {})
  }, [])
  async function login(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErr(false)
    try {
      const r = await fetch('/api/org/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
      if (!r.ok) throw new Error()
      const { token } = (await r.json()) as { token: string }
      writeToken(token)
      onToken(token)
    } catch {
      setErr(true)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={login} className="card mx-auto mt-6 max-w-md space-y-5 p-8">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
        <Lock size={26} />
      </span>
      <div>
        <h1 className="text-3xl font-extrabold">Organisers only</h1>
        <p className="mt-1 text-lg text-ink/70">City of Espoo event team.</p>
      </div>
      <input type="password" className="input" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus aria-label="Password" />
      {err && <p className="font-semibold text-rose">Wrong password. Try again.</p>}
      {demoHint && <p className="text-ink/70">Demo password: espoo2026</p>}
      <button className="btn-primary w-full text-lg" disabled={!pw || busy}>
        Log in
      </button>
    </form>
  )
}

const EMPTY = { name: '', sector: '', contact: '', email: '', nextStep: '', nextDate: '', source: 'Added by hand' }
const today = () => new Date().toISOString().slice(0, 10)

export function OrgCompanies({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [rows, setRows] = useState<Prospect[] | null>(null)
  const [stage, setStage] = useState<Stage | 'All'>('All')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)

  async function api<T>(method: string, url: string, body?: unknown): Promise<T> {
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined })
    if (r.status === 401) {
      // server restarted or session ended: back to the login
      writeToken(null)
      onLogout()
      throw new Error('logged out')
    }
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Something went wrong')
    return r.json()
  }

  useEffect(() => {
    api<Prospect[]>('GET', '/api/org/companies').then(setRows).catch(() => setError('Could not load the list.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const update = async (id: string, patch: Partial<Prospect>) => {
    setRows((r) => r?.map((x) => (x.id === id ? { ...x, ...patch } : x)) ?? null)
    try {
      await api('PATCH', `/api/org/companies/${id}`, patch)
    } catch {
      setError('Could not save. Check the connection.')
    }
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const row = await api<Prospect>('POST', '/api/org/companies', { ...form, status: 'Idea' })
      setRows((r) => [row, ...(r ?? [])])
      setForm(EMPTY)
      setAdding(false)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this company from the list?')) return
    setRows((r) => r?.filter((x) => x.id !== id) ?? null)
    await api('DELETE', `/api/org/companies/${id}`).catch(() => setError('Could not delete.'))
  }

  const counts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, rows?.filter((r) => r.status === s).length ?? 0])), [rows])
  const shown = (rows ?? []).filter((r) => (stage === 'All' || r.status === stage) && `${r.name} ${r.sector} ${r.contact} ${r.notes}`.toLowerCase().includes(q.toLowerCase()))
  const due = (rows ?? []).filter((r) => r.nextDate && r.nextDate <= today() && !['Hired someone', 'Not now'].includes(r.status)).length

  return (
    <div className="pop space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold">Companies to bring in</h2>
          <p className="mt-1 text-lg text-ink/70">{due ? `${due} follow-up${due > 1 ? 's' : ''} due today or earlier.` : 'No follow-ups due.'}</p>
        </div>
        <button className="btn-primary" onClick={() => setAdding((a) => !a)}>
          <Plus size={20} /> Add company
        </button>
        <button className="btn-ghost" onClick={onLogout}>
          Log out
        </button>
      </div>

      {error && <p className="rounded-2xl bg-rose-soft p-4 font-semibold text-rose">{error}</p>}

      {adding && (
        <form onSubmit={add} className="card grid gap-3 p-6 sm:grid-cols-2">
          <input className="input" placeholder="Company name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          <input className="input" placeholder="Sector" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
          <input className="input" placeholder="Contact person or role" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <input className="input" type="email" placeholder="Work email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Next step" value={form.nextStep} onChange={(e) => setForm({ ...form, nextStep: e.target.value })} />
          <input className="input" type="date" aria-label="Next step date" value={form.nextDate} onChange={(e) => setForm({ ...form, nextDate: e.target.value })} />
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary" disabled={!form.name.trim()}>
              Save company
            </button>
            <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* pipeline: tap a stage to filter */}
      <div className="flex flex-wrap gap-2">
        {(['All', ...STAGES] as const).map((s) => (
          <button key={s} onClick={() => setStage(s)} className={`chip px-4 py-2 text-base ${stage === s ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15'}`}>
            {s} <span className={stage === s ? 'text-white/70' : 'text-ink/60'}>{s === 'All' ? rows?.length ?? 0 : counts[s]}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-white px-4">
        <Search size={20} className="text-ink/60" />
        <input className="w-full py-3 text-lg outline-none" placeholder="Search companies, people, notes" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {!rows ? (
        <p className="text-lg text-ink/70">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-lg text-ink/70">No companies here yet. Add one above.</p>
      ) : (
        <ul className="space-y-4">
          {shown.map((r) => {
            const late = r.nextDate && r.nextDate <= today() && !['Hired someone', 'Not now'].includes(r.status)
            return (
              <li key={r.id} className="card space-y-4 p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xl font-extrabold">{r.name}</div>
                    <div className="text-ink/70">{[r.sector, r.contact, r.source].filter(Boolean).join(', ')}</div>
                  </div>
                  <select
                    className="rounded-xl border-2 border-ink/10 bg-white px-3 py-2 text-base font-semibold"
                    value={r.status}
                    onChange={(e) => update(r.id, { status: e.target.value as Stage })}
                    aria-label={`Stage for ${r.name}`}
                  >
                    {STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button className="rounded-xl p-2 text-ink/60 hover:bg-ink/6 hover:text-rose" onClick={() => remove(r.id)} aria-label={`Remove ${r.name}`}>
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                  <input className="input" placeholder="Next step" defaultValue={r.nextStep} onBlur={(e) => e.target.value !== r.nextStep && update(r.id, { nextStep: e.target.value })} />
                  <input
                    type="date"
                    className={`input ${late ? 'border-rose text-rose' : ''}`}
                    aria-label="Next step date"
                    defaultValue={r.nextDate}
                    onBlur={(e) => e.target.value !== r.nextDate && update(r.id, { nextDate: e.target.value })}
                  />
                </div>
                <textarea className="input min-h-16" placeholder="Notes" defaultValue={r.notes} onBlur={(e) => e.target.value !== r.notes && update(r.id, { notes: e.target.value })} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
