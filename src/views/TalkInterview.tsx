import { useEffect, useRef, useState } from 'react'
import { Keyboard, Loader2, Send, Volume2, VolumeX } from 'lucide-react'
import { post } from '../lib/store'
import { SPEECH_LANGS, speak, stopSpeaking, useSpeech } from '../lib/useSpeech'
import type { IntakeTurn } from '../lib/types'
import MicButton from './MicButton'

// Amira's answers, split so the stage demo can be clicked through.
const EXAMPLES = [
  'I have a master’s in electrical engineering. For 5 years I worked at a telecom operator in Damascus, finding the causes of network outages.',
  'I built a Python script that predicted which base stations would fail, so we fixed them before customers called. I led a team of 4 field engineers and explained problems to managers who were not technical.',
  'In Finland I finished a data analytics course. I want to work with data or reliability.',
]

export default function TalkInterview({ onDone }: { onDone: (answers: string) => void }) {
  const [lang, setLang] = useState('en-US')
  const [voiceOn, setVoiceOn] = useState(true)
  const [turns, setTurns] = useState<IntakeTurn[]>([])
  const [busy, setBusy] = useState(false)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const [netErr, setNetErr] = useState(false)
  const [finished, setFinished] = useState(false)
  const started = useRef(false)
  const bottom = useRef<HTMLDivElement>(null)
  const voice = useRef(voiceOn)
  voice.current = voiceOn

  const answers = turns.filter((t) => t.role === 'user')
  // Only real answers count: the server says how many it accepted.
  const [answered, setAnswered] = useState(0)

  async function send(next: IntakeTurn[]) {
    setBusy(true)
    setNetErr(false)
    try {
      const r = await post<{ reply: string; done: boolean; answered?: number }>('/api/talk', { turns: next, lang })
      setAnswered(r.answered ?? next.filter((t) => t.role === 'user').length)
      setTurns([...next, { role: 'assistant', content: r.reply }])
      if (voice.current) speak(r.reply, lang)
      if (r.done) {
        setFinished(true)
        onDone(next.filter((t) => t.role === 'user').map((t) => t.content).join(' '))
      }
    } catch {
      // Keep the history clean: give the answer back instead of inventing an assistant turn.
      setNetErr(true)
      const last = next.at(-1)
      if (last?.role === 'user') setDraft(last.content)
    } finally {
      setBusy(false)
    }
  }

  const answer = (text: string) => {
    if (!text.trim() || busy || finished) return
    setDraft('')
    send([...turns, { role: 'user', content: text.trim() }])
  }

  const mic = useSpeech(lang, answer)

  useEffect(() => {
    if (started.current && answers.length) return
    started.current = true
    send([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [turns, busy, mic.interim])
  useEffect(() => () => stopSpeaking(), [])

  return (
    <div className="card flex h-[540px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-ink/8 px-5 py-3">
        <span className="text-lg font-bold">Question {Math.min(answered + 1, 3)} of 3</span>
        <select className="ml-auto rounded-xl border-2 border-ink/10 bg-white px-3 py-1.5 text-base" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language you speak">
          {SPEECH_LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <button className="rounded-xl p-2 text-ink/70 hover:bg-ink/6" onClick={() => {
            if (voiceOn) stopSpeaking()
            setVoiceOn(!voiceOn)
          }} aria-label={voiceOn ? 'Mute assistant voice' : 'Read questions aloud'}>
          {voiceOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {turns.map((t, i) => (
          <div key={i} className={`pop flex ${t.role === 'user' ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] rounded-3xl px-5 py-3 text-lg ${t.role === 'user' ? 'rounded-br-lg bg-brand text-white' : 'rounded-bl-lg bg-brand-soft font-semibold'}`}>{t.content}</div>
          </div>
        ))}
        {mic.interim && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-3xl rounded-br-lg bg-brand/60 px-5 py-3 text-lg text-white italic">{mic.interim}…</div>
          </div>
        )}
        {busy && (
          <div className="flex items-center gap-2 text-ink/65">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}
        <div ref={bottom} />
      </div>

      {!finished && (
        <div className="space-y-3 border-t border-ink/8 p-4">
          {typing ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                answer(draft)
              }}
            >
              <input autoFocus className="input" placeholder="Type your answer" value={draft} onChange={(e) => setDraft(e.target.value)} />
              <button className="btn-primary px-4" disabled={busy || !draft.trim()} aria-label="Send">
                <Send size={20} />
              </button>
              <MicButton listening={false} onStart={() => setTyping(false)} onStop={() => {}} />
            </form>
          ) : (
            <div className="flex items-center gap-4">
              <MicButton big listening={mic.listening} onStart={mic.start} onStop={mic.stop} />
              <div className="flex-1 text-lg font-bold">
                {mic.error ? <span className="text-rose">{mic.error}</span> : mic.listening ? <span className="text-rose">Listening… tap to stop</span> : 'Tap to speak'}
              </div>
              <button className="btn-ghost px-4" onClick={() => setTyping(true)} aria-label="Type instead">
                <Keyboard size={20} />
              </button>
            </div>
          )}
          {netErr && <p className="font-semibold text-rose">Connection problem. Your answer is in the box, try again.</p>}
          {EXAMPLES[answered] && !busy && !mic.listening && (
            <button onClick={() => answer(EXAMPLES[answered])} className="w-full rounded-2xl border-2 border-dashed border-brand/30 px-4 py-2 text-left font-semibold text-brand hover:bg-brand-soft/50">
              Demo: answer as Amira
            </button>
          )}
        </div>
      )}
    </div>
  )
}
