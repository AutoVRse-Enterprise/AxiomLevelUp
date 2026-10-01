import { CheckCircle2, CircleAlert } from 'lucide-react'

import { cn } from '@/lib/cn'
import type { EvaluationResult } from '@/primitives/types'

type ReviewStatus = NonNullable<EvaluationResult['items']>[string]

const labels: Record<ReviewStatus, string> = {
  correct: 'Correct selection',
  incorrect: 'Incorrect selection',
  missed: 'Correct answer',
}

export function ReviewMark({ status, label }: { status: ReviewStatus; label?: string }) {
  const Icon = status === 'incorrect' ? CircleAlert : CheckCircle2

  return (
    <span
      className={cn(
        'ml-auto inline-flex shrink-0 items-center gap-1 text-small font-semibold',
        status === 'incorrect' ? 'text-danger-700' : 'text-success-700',
      )}
    >
      <Icon aria-hidden="true" size={18} />
      <span>{label ?? labels[status]}</span>
    </span>
  )
}
