import { CheckCircle2, CircleAlert } from 'lucide-react'

import { Button } from '@/components/ui'
import type { Source } from '@/content/schema'

interface FeedbackPanelProps {
  correct: boolean
  message: string | null
  source?: Source
  canRetry: boolean
  onRetry: () => void
  onContinue: () => void
}

export function FeedbackPanel({
  correct,
  message,
  source,
  canRetry,
  onRetry,
  onContinue,
}: FeedbackPanelProps) {
  return (
    <aside
      aria-live="polite"
      className={`rounded-xl border p-5 ${
        correct
          ? 'border-success-600 bg-success-50'
          : 'border-warning-600 bg-warning-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {correct ? (
          <CheckCircle2 aria-hidden="true" className="text-success-700" />
        ) : (
          <CircleAlert aria-hidden="true" className="text-warning-700" />
        )}
        <h2 className="text-heading font-bold text-neutral-950">
          {correct ? 'Correct' : 'Not quite'}
        </h2>
      </div>
      {message ? <p className="mt-3 text-neutral-800">{message}</p> : null}
      {source ? (
        <p className="mt-3 text-small text-neutral-600">
          Source: {source.title}
          {source.section ? `, ${source.section}` : ''}
          {source.page !== undefined ? `, p. ${source.page}` : ''}
        </p>
      ) : null}
      <Button className="mt-5" onClick={canRetry ? onRetry : onContinue}>
        {canRetry ? 'Try again' : 'Continue'}
      </Button>
    </aside>
  )
}
