import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui'

interface ErrorStateProps {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function ErrorState({ title, message, actionLabel, onAction }: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-danger-600/20 bg-danger-50 p-6">
      <AlertTriangle aria-hidden="true" className="text-danger-700" />
      <h1 className="mt-4 text-heading font-bold text-neutral-900">{title}</h1>
      <p className="mt-2 text-neutral-700">{message}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
