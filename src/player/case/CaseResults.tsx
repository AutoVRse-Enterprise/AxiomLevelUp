import { ArrowRight, RotateCcw, Scale } from 'lucide-react'
import { useState } from 'react'

import { Button, Card, Chip, Sheet } from '@/components/ui'
import type { CaseClue, CaseDocument, CaseLabConfig } from '@/content/schema'
import { starsForScore } from '@/engines/gamification/stars'
import { ClueContent } from '@/player/case/ClueBoard'
import type { CaseResultPresentation } from '@/player/case/types'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'

interface CaseResultsProps {
  caseDoc: CaseDocument
  result: CaseResultPresentation
  clues: readonly CaseClue[]
  clueReview: CaseLabConfig['clueReview']
  starThresholds: { one: number; two: number; three: number }
  onCompare: (evidenceAnchor?: string) => void
  onContinue: () => void
  onReplay: () => void
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function points(value: number) {
  return Number(value.toFixed(1)).toString()
}

function formatDuration(seconds: number) {
  const roundedSeconds = Math.max(0, Math.round(seconds))
  return `${Math.floor(roundedSeconds / 60)}:${String(roundedSeconds % 60).padStart(2, '0')}`
}

export function CaseResults({
  caseDoc,
  result,
  clues,
  clueReview,
  starThresholds,
  onCompare,
  onContinue,
  onReplay,
}: CaseResultsProps) {
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const { breakdown } = result
  const stars = starsForScore(breakdown.total, starThresholds)
  const completeBreakdown =
    breakdown.weights !== undefined &&
    breakdown.clueCostPoints !== undefined &&
    breakdown.speedScored !== undefined
  const reviewedClueIds = result.reviewedClueIds ?? []
  const stepLabels = new Map(
    caseDoc.stages
      .flatMap(({ steps }) => steps)
      .flatMap((step, index) => {
        const resolved = resolvePrimitiveDefinition(step)
        return resolved
          ? ([
              [
                step.id,
                {
                  label: resolved.definition.reviewPrompt(resolved.primitive),
                  anchor: resolved.definition.scored(resolved.primitive)
                    ? `expert-step-${index}`
                    : null,
                },
              ],
            ] as const)
          : []
      }),
  )
  const inspectedFindingIds = new Set(
    result.evidence?.inspectedFindingIds ??
      result.stepResults.flatMap(({ response }) => {
        if (!response || typeof response !== 'object') return []
        const inspected = Reflect.get(response, 'inspectedFindingIds')
        return Array.isArray(inspected)
          ? inspected.filter((id): id is string => typeof id === 'string')
          : []
      }),
  )
  result.evidence?.pinned.forEach(({ kind, id }) => {
    if (kind === 'finding') inspectedFindingIds.add(id)
  })
  const evidenceItems = caseDoc.debrief.keyEvidence.flatMap((entry, index) => {
    const clue =
      entry.ref.kind === 'clue'
        ? clues.find((candidate) => candidate.id === entry.ref.id)
        : undefined
    const finding =
      entry.ref.kind === 'finding'
        ? caseDoc.findings?.find((candidate) => candidate.id === entry.ref.id)
        : undefined
    if (!clue && !finding) return []
    const reviewed =
      entry.ref.kind === 'clue'
        ? result.reviewedClueIds === undefined
          ? null
          : reviewedClueIds.includes(entry.ref.id)
        : inspectedFindingIds.has(entry.ref.id)
    return [
      {
        entry,
        index,
        clue,
        finding,
        label: clue?.title ?? finding!.label,
        reviewed,
        tasks: entry.stepIds.flatMap((id) => {
          const task = stepLabels.get(id)
          return task ? [task] : []
        }),
      },
    ]
  })
  const selectedEvidence =
    reviewIndex === null ? null : (evidenceItems.find(({ index }) => index === reviewIndex) ?? null)

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <p className="text-small font-semibold text-success-700">Case complete</p>
      <h1 className="mt-2 text-display font-bold text-neutral-950">{caseDoc.title}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="brand">{breakdown.total}/100</Chip>
        <Chip aria-label={`${stars} of 3 stars`}>
          <span aria-hidden="true">
            {'★'.repeat(stars)}
            {'☆'.repeat(3 - stars)}
          </span>
        </Chip>
        <Chip>{formatDuration(breakdown.durationSeconds)}</Chip>
        {result.actualAwardedXp !== undefined && result.actualAwardedXp !== null ? (
          <Chip>{result.actualAwardedXp} XP awarded</Chip>
        ) : null}
      </div>
      <p className="mt-4 text-small text-neutral-600">
        This score uses your first submitted response for each scored task; retries support learning
        but do not replace the scored response.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {(
          [
            ['Anatomy', 'anatomy', breakdown.anatomy],
            ['Diagnosis', 'diagnosis', breakdown.diagnosis],
            ['Speed', 'speed', breakdown.speed],
          ] as const
        ).map(([label, component, value]) => {
          const notScored = component === 'speed' && breakdown.speedScored === false
          const unavailable = component === 'speed' && breakdown.speedScored === undefined
          const weight = breakdown.weights?.[component]
          return (
            <Card key={label}>
              <dt className="text-small text-neutral-600">{label}</dt>
              <dd className="mt-1 text-title font-bold text-neutral-950">
                {notScored ? 'Not scored' : unavailable ? 'Unavailable' : percent(value)}
              </dd>
              {weight !== undefined ? (
                <p className="mt-1 text-small text-neutral-600">
                  {percent(weight)} weight · {points(value * weight * 100)} points
                </p>
              ) : null}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-brand-700"
                  style={{
                    width: notScored || unavailable ? '0%' : percent(value),
                  }}
                />
              </div>
            </Card>
          )
        })}
      </dl>

      {completeBreakdown ? (
        <Card className="mt-5">
          <h2 className="text-heading font-bold text-neutral-950">Score details</h2>
          {breakdown.speedModel === 'time_eligible' && breakdown.speedEligibility ? (
            <p className="mt-2 text-small text-neutral-600">
              Speed uses time only. First-attempt scores of{' '}
              {percent(breakdown.speedEligibility.minStepScore)} or higher are eligible (
              {breakdown.speedEligibility.eligibleSteps}/
              {breakdown.speedEligibility.totalScoredSteps} steps).
            </p>
          ) : null}
          <dl className="mt-4 grid grid-cols-2 gap-4 text-small sm:grid-cols-4">
            <div>
              <dt className="text-neutral-600">Step speed</dt>
              <dd className="font-semibold">
                {breakdown.speedScored && breakdown.perStepSpeed !== undefined
                  ? percent(breakdown.perStepSpeed)
                  : 'Not scored'}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-600">Case speed</dt>
              <dd className="font-semibold">
                {breakdown.speedScored && breakdown.caseSpeed !== undefined
                  ? percent(breakdown.caseSpeed)
                  : 'Not scored'}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-600">Clues opened</dt>
              <dd className="font-semibold">{breakdown.openedClueIds.length}</dd>
            </div>
            <div>
              <dt className="text-neutral-600">Clue cost</dt>
              <dd className="font-semibold">−{breakdown.clueCostPoints} points</dd>
            </div>
          </dl>
          {result.timeoutCreditApplied ? (
            <p className="mt-4 text-small text-neutral-600">
              Timeout credit includes committed progress; timed-out steps receive no step-speed
              credit.
            </p>
          ) : null}
        </Card>
      ) : (
        <p className="mt-5 rounded-lg bg-neutral-100 p-4 text-small text-neutral-700">
          Detailed speed, weighting, clue cost and reward data are unavailable for this legacy
          attempt.
        </p>
      )}

      <Card className="mt-5">
        <h2 className="text-heading font-bold text-neutral-950">Debrief</h2>
        <p className="mt-3 text-neutral-700">{caseDoc.debrief.summary}</p>
        <div className="mt-5">
          <h3 className="font-semibold text-neutral-900">Key evidence</h3>
          <ul className="mt-3 space-y-3">
            {evidenceItems.map(({ entry, index, label, reviewed, tasks }) => (
              <li className="rounded-lg border border-neutral-200 p-4" key={index}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-neutral-950">{label}</p>
                  <Chip tone={reviewed ? 'success' : 'neutral'}>
                    {reviewed === null
                      ? 'Status unavailable'
                      : entry.ref.kind === 'clue'
                        ? reviewed
                          ? 'Reviewed'
                          : 'Not reviewed'
                        : reviewed
                          ? 'Inspected'
                          : 'Not inspected'}
                  </Chip>
                </div>
                <p className="mt-2 text-small text-neutral-700">{entry.why}</p>
                {tasks.length ? (
                  <p className="mt-2 text-caption text-neutral-600">
                    Affected tasks:{' '}
                    {tasks.map(({ anchor, label: taskLabel }, taskIndex) => (
                      <span key={`${taskLabel}:${taskIndex}`}>
                        {taskIndex > 0 ? '; ' : ''}
                        {anchor ? (
                          <button
                            className="font-semibold text-brand-800 underline underline-offset-2 focus-visible:outline-2"
                            type="button"
                            onClick={() => onCompare(anchor)}
                          >
                            {taskLabel}
                          </button>
                        ) : (
                          <span className="font-semibold text-neutral-700">{taskLabel}</span>
                        )}
                      </span>
                    ))}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setReviewIndex(index)}>
                    Review
                  </Button>
                  <Button
                    leadingIcon={<ArrowRight aria-hidden="true" size={16} />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onCompare(`expert-evidence-${index}`)}
                  >
                    See expert comparison
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Sheet
        open={selectedEvidence !== null}
        title={selectedEvidence?.label ?? 'Review evidence'}
        description="Read-only remediation. Reviewing here does not change your score or clue history."
        onOpenChange={(open) => {
          if (!open) setReviewIndex(null)
        }}
      >
        {selectedEvidence?.clue ? (
          <ClueContent
            active={false}
            clue={selectedEvidence.clue}
            clueReview={clueReview}
            context="remediation-read-only"
          />
        ) : selectedEvidence?.finding ? (
          <div>
            <p className="text-small font-semibold text-neutral-600">Configured finding</p>
            <p className="mt-2 text-neutral-800">{selectedEvidence.finding.description}</p>
          </div>
        ) : null}
      </Sheet>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button leadingIcon={<Scale aria-hidden="true" size={18} />} onClick={() => onCompare()}>
          Compare
        </Button>
        <Button variant="secondary" onClick={onContinue}>
          Continue
        </Button>
        <Button
          leadingIcon={<RotateCcw aria-hidden="true" size={18} />}
          variant="ghost"
          onClick={onReplay}
        >
          Replay
        </Button>
      </div>
    </div>
  )
}
