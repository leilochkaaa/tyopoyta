// Brand mark: a round table seen from above, with seats around it.
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="11" fill="#2540f0" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={20 + 16.5 * Math.sin((a * Math.PI) / 180)} cy={20 - 16.5 * Math.cos((a * Math.PI) / 180)} r="3.4" fill="#ffb21e" />
      ))}
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-2xl font-extrabold">työpöytä</span>
    </span>
  )
}
