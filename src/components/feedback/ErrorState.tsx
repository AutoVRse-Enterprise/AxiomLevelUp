import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui'

interface ErrorStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  titleAs?: 'h1' | 'h2'
  details?: ReactNode
}

export function ErrorState({
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  titleAs: Heading = 'h1',
  details,
}: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-danger-600/20 bg-danger-50 p-6">
      <AlertTriangle aria-hidden="true" className="text-danger-700" />
      <Heading className="mt-4 text-heading font-bold text-neutral-900">{title}</Heading>
      <p className="mt-2 text-neutral-700">{message}</p>
      {details}
      {actionLabel || secondaryActionLabel ? <div className="mt-5 flex flex-wrap gap-3">
        {actionLabel && onAction ? (
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {secondaryActionLabel && onSecondaryAction ? (
          <Button variant="ghost" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        ) : null}
      </div> : null}
    </div>
  )
}
