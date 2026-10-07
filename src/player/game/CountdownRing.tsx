export function CountdownRing({
  seconds,
  totalSeconds,
  label,
}: {
  seconds: number
  totalSeconds: number
  label: string
}) {
  const fraction = totalSeconds > 0 ? Math.min(1, Math.max(0, seconds / totalSeconds)) : 0
  const circumference = 2 * Math.PI * 18
  return (
    <div
      aria-label={label.replace('{seconds}', String(seconds))}
      className="relative grid size-12 place-items-center"
      role="timer"
    >
      <svg aria-hidden="true" className="-rotate-90" height="44" viewBox="0 0 44 44" width="44">
        <circle
          cx="22"
          cy="22"
          fill="none"
          r="18"
          stroke="currentColor"
          strokeOpacity=".2"
          strokeWidth="4"
        />
        <circle
          cx="22"
          cy="22"
          fill="none"
          r="18"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
          strokeLinecap="round"
          strokeWidth="4"
        />
      </svg>
      <span aria-hidden="true" className="absolute font-mono text-xs font-bold tabular-nums">
        {seconds}
      </span>
    </div>
  )
}
