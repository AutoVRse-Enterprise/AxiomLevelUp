import type { NormalizedPoint } from '@/content/schema/primitives'

export function LocationMarker({
  point,
  label,
  status,
}: {
  point: NormalizedPoint
  label: string
  status?: 'correct' | 'incorrect'
}) {
  return (
    <span
      aria-label={label}
      className={`pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-2 ${
        status === 'correct'
          ? 'bg-success-600 ring-success-700'
          : status === 'incorrect'
            ? 'bg-danger-600 ring-danger-700'
            : 'bg-brand-700 ring-brand-800'
      }`}
      role="img"
      style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
    />
  )
}
