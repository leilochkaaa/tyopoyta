import { useCallback, useEffect, useRef, useState } from 'react'

// Voice in and out. With an ElevenLabs key on the server, answers are recorded and
// transcribed by ElevenLabs Scribe and questions are spoken by ElevenLabs voices.
// Otherwise the browser's Web Speech API is used. Recordings are never stored.

export const SPEECH_LANGS = [
  { code: 'en-US', label: 'English' },
  { code: 'fi-FI', label: 'Suomi' },
  { code: 'sv-SE', label: 'Svenska' },
  { code: 'ru-RU', label: 'Русский' },
  { code: 'uk-UA', label: 'Українська' },
  { code: 'ar-SA', label: 'العربية' },
  { code: 'so-SO', label: 'Soomaali' },
  { code: 'et-EE', label: 'Eesti' },
  { code: 'es-ES', label: 'Español' },
]

type VoiceMode = 'elevenlabs' | 'browser'
const voiceMode: Promise<VoiceMode> = fetch('/api/health')
  .then((r) => r.json())
  .then((j) => (j.voice === 'elevenlabs' ? 'elevenlabs' : 'browser'))
  .catch(() => 'browser')

interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
}

const Ctor = (globalThis as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ??
  (globalThis as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition

export function useSpeech(lang: string, onFinal: (text: string) => void) {
  const [mode, setMode] = useState<VoiceMode>('browser')
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const rec = useRef<Recognition | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const finalRef = useRef(onFinal)
  const alive = useRef(true)
  const starting = useRef(false)
  finalRef.current = onFinal

  useEffect(() => {
    alive.current = true
    voiceMode.then(setMode)
    return () => {
      // Unmounted: drop any transcript that arrives later instead of acting on it.
      alive.current = false
      finalRef.current = () => {}
      rec.current?.stop()
      if (recorder.current?.state === 'recording') recorder.current.stop()
    }
  }, [])

  const startRecorder = useCallback(async () => {
    if (starting.current || recorder.current?.state === 'recording') return
    starting.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!alive.current) return stream.getTracks().forEach((t) => t.stop())
      const r = new MediaRecorder(stream)
      const chunks: Blob[] = []
      r.ondataavailable = (e) => chunks.push(e.data)
      r.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (!alive.current) return
        setListening(false)
        setInterim('Transcribing…')
        try {
          const blob = new Blob(chunks, { type: r.mimeType || 'audio/webm' })
          const res = await fetch(`/api/stt?lang=${lang.slice(0, 2)}`, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob })
          if (!res.ok) throw new Error()
          const { text } = (await res.json()) as { text: string }
          if (text.trim()) finalRef.current(text.trim())
        } catch {
          // A recorder is the cross-browser fallback when native recognition is unavailable.
          setMode('browser')
          setError(Ctor ? 'Switched to your browser’s voice. Tap the mic again.' : 'Server speech-to-text is unavailable. Use text input or enable ElevenLabs.')
        } finally {
          setInterim('')
        }
      }
      recorder.current = r
      r.start()
      setInterim('Recording… tap ■ when you’re done')
      setListening(true)
    } catch {
      setError('Microphone permission denied')
    } finally {
      starting.current = false
    }
  }, [lang])

  const startBrowser = useCallback(() => {
    if (!Ctor) return setError('Voice input works in Chrome, Edge or Safari')
    rec.current?.stop()
    const r = new Ctor()
    r.lang = lang
    r.continuous = true
    r.interimResults = true
    let finalText = ''
    r.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) finalText += res[0].transcript + ' '
        else live += res[0].transcript
      }
      setInterim((finalText + live).trim())
    }
    r.onerror = (e) => setError(e.error === 'not-allowed' ? 'Microphone permission denied' : e.error)
    r.onend = () => {
      setListening(false)
      setInterim('')
      if (finalText.trim()) finalRef.current(finalText.trim())
    }
    rec.current = r
    r.start()
    setListening(true)
  }, [lang])

  const start = useCallback(() => {
    setError(null)
    if (mode === 'elevenlabs' && 'MediaRecorder' in globalThis) return startRecorder()
    if (Ctor) return startBrowser()
    if ('MediaRecorder' in globalThis) return startRecorder()
    setError('Voice input is not supported in this browser')
  }, [mode, startRecorder, startBrowser])

  const stop = useCallback(() => {
    rec.current?.stop()
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }, [])

  return { supported: mode === 'elevenlabs' || Boolean(Ctor), mode, listening, interim, error, start, stop }
}

let playing: HTMLAudioElement | null = null
let speakId = 0 // a newer speak() or stopSpeaking() cancels audio still loading

export function stopSpeaking() {
  speakId++
  playing?.pause()
  if ('speechSynthesis' in globalThis) speechSynthesis.cancel()
}

export async function speak(text: string, lang: string) {
  stopSpeaking()
  const id = speakId
  if ((await voiceMode) === 'elevenlabs') {
    try {
      const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      if (!r.ok) throw new Error()
      const blob = await r.blob()
      if (id !== speakId) return
      const url = URL.createObjectURL(blob)
      playing = new Audio(url)
      playing.onended = playing.onpause = () => URL.revokeObjectURL(url)
      await playing.play()
      return
    } catch {
      // fall through to the browser voice
    }
  }
  if (id !== speakId || !('speechSynthesis' in globalThis)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = 0.95
  speechSynthesis.speak(u)
}
