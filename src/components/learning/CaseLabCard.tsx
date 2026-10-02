import { ArrowRight, Clock3, FlaskConical } from 'lucide-react'
import { Link } from 'react-router'

import { Card, Chip } from '@/components/ui'
import type { CaseLabCardView } from '@/state/selectors'

export function CaseLabCard({
  caseView,
  featured = false,
}: {
  caseView: CaseLabCardView
  featured?: boolean
}) {
  return (
    <Link
      aria-label={`Open case: ${caseView.title}`}
      className="block rounded-lg focus-visible:outline-2"
      to={`/learn/cases/${caseView.caseId}`}
    >
      <Card
        className={
          featured
            ? 'h-full border-brand-300 bg-gradient-to-br from-brand-50 to-white'
            : 'h-full'
        }
        interactive
      >
        <div className="flex items-start justify-between gap-4">
          <FlaskConical aria-hidden="true" className="text-brand-700" size={28} />
          <Chip tone="brand">{caseView.tierLabel}</Chip>
        </div>
        <h3 className="mt-4 text-heading font-bold text-neutral-950">{caseView.title}</h3>
        <p className="mt-2 text-small text-neutral-600">{caseView.summary}</p>
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-small">
          <div>
            <dt className="text-neutral-500">Organ system</dt>
            <dd className="font-semibold capitalize text-neutral-800">{caseView.organSystem}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Time</dt>
            <dd className="flex items-center gap-1 font-semibold text-neutral-800">
              <Clock3 aria-hidden="true" size={14} />
              {caseView.estimatedMinutes} min
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Best score</dt>
            <dd className="font-semibold text-neutral-800">
              {caseView.bestScore === null ? '—' : `${caseView.bestScore} points`}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Attempts</dt>
            <dd className="font-semibold text-neutral-800">{caseView.attempts}</dd>
          </div>
        </dl>
        <span className="mt-5 inline-flex items-center gap-2 font-semibold text-brand-700">
          Open case <ArrowRight aria-hidden="true" size={17} />
        </span>
      </Card>
    </Link>
  )
}
