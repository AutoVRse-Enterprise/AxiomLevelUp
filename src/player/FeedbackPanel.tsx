import { CheckCircle2, CircleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui'
import type { Source } from '@/content/schema'

export type FeedbackStatus = 'correct' | 'partial' | 'incorrect'

interface FeedbackPanelProps {
  status: FeedbackStatus
  message: string | null
  source?: Source
  canRetry: boolean
  xpEarned?: number
  onRetry: () => void
  onContinue: () => void
}

export function FeedbackPanel({
  status,
  message,
  source,
  canRetry,
  xpEarned = 0,
  onRetry,
  onContinue,
}: FeedbackPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const correct = status === 'correct'

  useEffect(() => {
    headingRef.current?.focus()
  }, [status])

  return (
    <aside
      aria-live="polite"
      className={`rounded-xl border p-5 ${
        correct ? 'border-success-600 bg-success-50' : 'border-warning-600 bg-warning-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {correct ? (
          <CheckCircle2 aria-hidden="true" className="text-success-700" />
        ) : (
          <CircleAlert aria-hidden="true" className="text-warning-700" />
        )}
        <h2 ref={headingRef} tabIndex={-1} className="text-heading font-bold text-neutral-950">
          {status === 'correct'
            ? 'Correct'
            : status === 'partial'
              ? 'Partially correct'
              : 'Not quite'}
        </h2>
      </div>
      {message ? <p className="mt-3 text-neutral-800">{message}</p> : null}
      {xpEarned > 0 ? <p className="mt-3 font-bold text-brand-800">+{xpEarned} XP</p> : null}
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
