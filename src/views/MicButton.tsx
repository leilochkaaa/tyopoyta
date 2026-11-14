import { Mic, Square } from 'lucide-react'

export default function MicButton({ listening, onStart, onStop, big }: { listening: boolean; onStart: () => void; onStop: () => void; big?: boolean }) {
  const size = big ? 'h-20 w-20' : 'h-12 w-12'
  return (
    <button
      type="button"
      onClick={listening ? onStop : onStart}
      aria-label={listening ? 'Stop and send' : 'Tap to speak'}
      title={listening ? 'Stop and send' : 'Tap to speak'}
      className={`grid shrink-0 place-items-center rounded-full text-white transition ${size} ${listening ? 'pulse-ring bg-rose' : 'bg-brand hover:bg-brand-deep'}`}
    >
      {listening ? <Square size={big ? 28 : 18} fill="currentColor" /> : <Mic size={big ? 34 : 22} />}
    </button>
  )
}
