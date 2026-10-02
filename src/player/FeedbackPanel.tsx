import { CheckCircle2, CircleAlert } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect, useRef } from 'react'

import { AnimatedNumber, Button } from '@/components/ui'
import type { Source } from '@/content/schema'
import type { MissedClue } from '@/engines/cases/clues'

export type FeedbackStatus = 'correct' | 'partial' | 'incorrect'

interface FeedbackPanelProps {
  status: FeedbackStatus
  message: string | null
  source?: Source
  canRetry: boolean
  xpEarned?: number
  missedClues?: readonly MissedClue[]
  onRetry: () => void
  onContinue: () => void
  onReopenClue?: (clueId: string) => void
}

export function FeedbackPanel({
  status,
  message,
  source,
  canRetry,
  xpEarned = 0,
  missedClues = [],
  onRetry,
  onContinue,
  onReopenClue,
}: FeedbackPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const correct = status === 'correct'

  useEffect(() => {
    headingRef.current?.focus()
  }, [status])

  return (
    <m.aside
      animate={
        correct ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: 0, x: [-6, 5, -3, 0] }
      }
      aria-live="polite"
      className={`rounded-xl border p-5 ${
        correct ? 'border-success-600 bg-success-50' : 'border-warning-600 bg-warning-50'
      }`}
      initial={{ opacity: 0, scale: 0.98, y: 12 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
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
      {xpEarned > 0 ? (
        <m.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 inline-flex rounded-full bg-xp/10 px-3 py-1 font-bold text-xp"
          initial={{ opacity: 0, y: 8 }}
          transition={{ delay: 0.12, duration: 0.25 }}
        >
          <AnimatedNumber
            format={(value) => `+${Math.round(value).toLocaleString()}`}
            value={xpEarned}
          />{' '}
          XP
        </m.p>
      ) : null}
      {source ? (
        <p className="mt-3 text-small text-neutral-600">
          Source: {source.title}
          {source.section ? `, ${source.section}` : ''}
          {source.page !== undefined ? `, p. ${source.page}` : ''}
        </p>
      ) : null}
      {!correct && missedClues.length > 0 && onReopenClue ? (
        <section className="mt-4 border-t border-warning-700/20 pt-4">
          <h3 className="font-semibold text-neutral-950">Evidence you may have missed</h3>
          <ul className="mt-2 space-y-2">
            {missedClues.map((clue) => (
              <li className="flex flex-wrap items-center justify-between gap-2" key={clue.id}>
                <span className="text-neutral-800">{clue.title}</span>
                <Button
                  aria-label={`Reopen clue: ${clue.title}`}
                  size="sm"
                  variant="secondary"
                  onClick={() => onReopenClue(clue.id)}
                >
                  Reopen clue
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Button className="mt-5" onClick={canRetry ? onRetry : onContinue}>
        {canRetry ? 'Try again' : 'Continue'}
      </Button>
    </m.aside>
  )
}
