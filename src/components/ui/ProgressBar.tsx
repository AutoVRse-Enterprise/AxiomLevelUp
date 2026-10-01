import { cn } from '@/lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  label: string
  className?: string
}

export function ProgressBar({ value, max = 100, label, className }: ProgressBarProps) {
  const safeMax = Math.max(max, 1)
  const normalized = Math.min(Math.max(value, 0), safeMax)
  const percentage = Math.round((normalized / safeMax) * 100)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-4 text-small">
        <span className="font-medium text-neutral-800">{label}</span>
        <span className="tabular-nums text-neutral-600">{percentage}%</span>
      </div>
      <div
        aria-label={label}
        aria-valuemax={safeMax}
        aria-valuemin={0}
        aria-valuenow={normalized}
        className="h-2 overflow-hidden rounded-full bg-neutral-200"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-brand-600 transition-[width] duration-250"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
