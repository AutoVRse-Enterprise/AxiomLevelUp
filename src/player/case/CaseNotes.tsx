import { MapPin, Pin, PinOff } from 'lucide-react'

import { Chip } from '@/components/ui'
import type { CaseDocument } from '@/content/schema'
import {
  canPinCaseEvidence,
  isCaseEvidencePinned,
  type CaseEvidenceItem,
} from '@/engines/cases/evidence'
import type { CaseProgress } from '@/engines/learning/session'

type Confidence = CaseProgress['differential'][string]

interface CaseNotesProps {
  caseDoc: CaseDocument
  progress: CaseProgress
  availableClueIds?: readonly string[]
  inspectedFindingIds: ReadonlySet<string>
  caseComplete?: boolean
  currentLocationLabel: string | null
  onOpenClue: (clueId: string) => void
  onPinChange: (item: CaseEvidenceItem, pinned: boolean) => void
  onHypothesisChange: (hypothesisId: string, confidence: Confidence) => void
}

const confidenceOptions: Array<{ value: Confidence; label: string }> = [
  { value: 'unlikely', label: 'Unlikely' },
  { value: 'possible', label: 'Possible' },
  { value: 'likely', label: 'Likely' },
]

function PinButton({
  item,
  progress,
  inspectedFindingIds,
  onPinChange,
}: Pick<CaseNotesProps, 'progress' | 'inspectedFindingIds' | 'onPinChange'> & {
  item: CaseEvidenceItem
}) {
  const pinned = isCaseEvidencePinned(progress.evidence.pinned, item)
  const eligible = canPinCaseEvidence(item, progress.reviewedClueIds, inspectedFindingIds)
  return (
    <button
      type="button"
      className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-small font-semibold text-neutral-800 hover:bg-neutral-50 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-45"
      disabled={!eligible}
      aria-label={`${pinned ? 'Unpin' : 'Pin'} ${item.kind}`}
      onClick={() => onPinChange(item, !pinned)}
    >
      {pinned ? <PinOff aria-hidden="true" size={15} /> : <Pin aria-hidden="true" size={15} />}
      {pinned ? 'Unpin' : 'Pin'}
    </button>
  )
}

export function CaseNotes({
  caseDoc,
  progress,
  availableClueIds,
  inspectedFindingIds,
  caseComplete = false,
  currentLocationLabel,
  onOpenClue,
  onPinChange,
  onHypothesisChange,
}: CaseNotesProps) {
  const availableClues = availableClueIds
    ? caseDoc.clues.filter(({ id }) => availableClueIds.includes(id))
    : caseDoc.clues
  const inspectedFindings = caseDoc.findings?.filter(({ id }) => inspectedFindingIds.has(id)) ?? []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-heading font-bold text-neutral-950">Case notes</h2>
        <Chip>{progress.evidence.pinned.length} pinned</Chip>
      </div>
      <p className="mt-2 text-small text-neutral-600">
        Organize the evidence that has become available so far.
      </p>

      <section className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
        <h3 className="flex items-center gap-2 font-semibold text-neutral-900">
          <MapPin aria-hidden="true" size={17} />
          Current location
        </h3>
        <p className="mt-1 text-small text-neutral-700">
          {currentLocationLabel ?? 'No mapped location recorded yet.'}
        </p>
      </section>

      <section className="mt-5">
        <h3 className="font-semibold text-neutral-950">Clues</h3>
        <ul className="mt-2 space-y-2">
          {availableClues.map((clue) => {
            const reviewed = progress.reviewedClueIds.includes(clue.id)
            const pinned = isCaseEvidencePinned(progress.evidence.pinned, {
              kind: 'clue',
              id: clue.id,
            })
            return (
              <li
                key={clue.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
              >
                <div className="min-w-0">
                  {pinned ? (
                    <button
                      type="button"
                      className="text-left font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-2"
                      onClick={() => onOpenClue(clue.id)}
                    >
                      {clue.title}
                    </button>
                  ) : (
                    <p className="font-semibold text-neutral-900">{clue.title}</p>
                  )}
                  <p className="mt-1 text-caption text-neutral-600">
                    {reviewed ? 'Reviewed' : 'Review this clue before pinning'}
                  </p>
                </div>
                <PinButton
                  item={{ kind: 'clue', id: clue.id }}
                  progress={progress}
                  inspectedFindingIds={inspectedFindingIds}
                  onPinChange={onPinChange}
                />
              </li>
            )
          })}
        </ul>
      </section>

      {inspectedFindings.length ? (
        <section className="mt-5">
          <h3 className="font-semibold text-neutral-950">Spatial findings</h3>
          <ul className="mt-2 space-y-2">
            {inspectedFindings.map((finding) => {
              return (
                <li
                  key={finding.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">{finding.label}</p>
                    <p className="mt-1 text-small text-neutral-700">{finding.description}</p>
                    <p className="mt-1 text-caption text-neutral-600">Inspected</p>
                  </div>
                  <PinButton
                    item={{ kind: 'finding', id: finding.id }}
                    progress={progress}
                    inspectedFindingIds={inspectedFindingIds}
                    onPinChange={onPinChange}
                  />
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {caseDoc.differential?.length ? (
        <section className="mt-5">
          <h3 className="font-semibold text-neutral-950">Differential</h3>
          <p className="mt-1 text-small text-neutral-600">
            Update confidence as the case develops.
          </p>
          <div className="mt-3 space-y-3">
            {caseDoc.differential.map((hypothesis) => (
              <fieldset key={hypothesis.id} className="rounded-lg border border-neutral-200 p-3">
                <legend className="px-1 font-semibold text-neutral-900">{hypothesis.label}</legend>
                {caseComplete && hypothesis.description ? (
                  <p className="mb-3 text-small text-neutral-600">{hypothesis.description}</p>
                ) : null}
                <div className="grid grid-cols-3 gap-1" role="group">
                  {confidenceOptions.map((option) => {
                    const selected = progress.differential[hypothesis.id] === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`min-h-10 rounded-md border px-1.5 py-2 text-caption font-semibold focus-visible:outline-2 ${
                          selected
                            ? 'border-brand-700 bg-brand-700 text-white'
                            : 'border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50'
                        }`}
                        aria-pressed={selected}
                        onClick={() => onHypothesisChange(hypothesis.id, option.value)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
