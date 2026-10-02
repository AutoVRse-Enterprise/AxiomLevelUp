import { ScanLine } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'
import { ProgressBar } from '@/components/ui/ProgressBar'

interface LoadingStateProps {
  title: string
  message?: string
  progress?: number
  progressLabel?: string
  icon?: ReactNode
  compact?: boolean
  className?: string
}

export function LoadingState({
  title,
  message,
  progress,
  progressLabel,
  icon = <ScanLine aria-hidden="true" size={24} />,
  compact = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card',
        compact ? 'p-4' : 'p-6 sm:p-8',
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-800">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-neutral-950">{title}</p>
          {message ? <p className="mt-1 text-small text-neutral-600">{message}</p> : null}
        </div>
      </div>
      {progress !== undefined ? (
        <ProgressBar
          className="mt-5"
          label={progressLabel ?? title}
          value={progress}
        />
      ) : (
        <div
          aria-hidden="true"
          className="mt-5 h-2 rounded-full bg-[linear-gradient(90deg,var(--color-neutral-100)_25%,var(--color-brand-100)_50%,var(--color-neutral-100)_75%)] bg-[length:200%_100%] animate-shimmer"
        />
      )}
    </div>
  )
}
