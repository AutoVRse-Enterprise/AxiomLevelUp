import { Clock3, UserRound } from 'lucide-react'

import type { CaseDocument } from '@/content/schema'

export function PatientTimeline({
  caseDoc,
  currentStageIndex,
}: {
  caseDoc: CaseDocument
  currentStageIndex: number
}) {
  const updates = caseDoc.stages
    .slice(0, currentStageIndex + 1)
    .flatMap((stage) => (stage.update ? [{ stageId: stage.id, ...stage.update }] : []))

  return (
    <details className="rounded-xl border border-neutral-200 bg-white shadow-card" open>
      <summary className="cursor-pointer list-none p-4 focus-visible:outline-2">
        <span className="flex items-center gap-2 font-bold text-neutral-950">
          <UserRound aria-hidden="true" size={18} />
          {caseDoc.patient.label}
        </span>
        <span className="mt-1 block text-small text-neutral-600">
          {[caseDoc.patient.age ? `${caseDoc.patient.age} years` : null, caseDoc.patient.sex]
            .filter(Boolean)
            .join(' · ')}
          {caseDoc.patient.age || caseDoc.patient.sex ? ' · ' : ''}
          {caseDoc.patient.presentingComplaint}
        </span>
      </summary>
      <div className="border-t border-neutral-200 px-4 py-3">
        <h2 className="text-caption font-bold tracking-wide text-neutral-600 uppercase">
          Patient timeline
        </h2>
        {updates.length ? (
          <ol className="mt-3 space-y-3">
            {updates.map((update, index) => (
              <li className="grid grid-cols-[auto_1fr] gap-3" key={update.stageId}>
                <span
                  aria-hidden="true"
                  className={`mt-1 grid size-6 place-items-center rounded-full ${
                    index === updates.length - 1
                      ? 'bg-brand-700 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <Clock3 size={13} />
                </span>
                <div>
                  <p className="text-small font-semibold text-neutral-900">{update.timeLabel}</p>
                  <p className="mt-0.5 text-small text-neutral-700">{update.narrative}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-small text-neutral-600">No patient updates yet.</p>
        )}
      </div>
    </details>
  )
}
