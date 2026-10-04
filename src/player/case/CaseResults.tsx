import { ArrowRight, RotateCcw, Scale } from 'lucide-react'
import { useState } from 'react'

import { useContent } from '@/app/contentContext'
import { CompletionMetrics } from '@/components/rewards/CompletionMetrics'
import { Button, Card, Chip, Sheet } from '@/components/ui'
import type { CaseClue, CaseDocument, CaseLabConfig, LearnerSeed } from '@/content/schema'
import {
  formatCaseOrganSystem,
  formatCaseTier,
  formatDuration,
  formatScore,
} from '@/engines/cases/formatters'
import { starsForScore } from '@/engines/gamification/stars'
import { ClueContent } from '@/player/case/ClueBoard'
import type { CaseResultPresentation } from '@/player/case/types'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'

interface CaseResultsProps {
  caseDoc: CaseDocument
  caseLab: CaseLabConfig
  result: CaseResultPresentation
  activityResult?: LearnerSeed['gamification']['lastActivityResult']
  clues: readonly CaseClue[]
  clueReview: CaseLabConfig['clueReview']
  starThresholds: { one: number; two: number; three: number }
  onCompare: (evidenceAnchor?: string) => void
  onContinue: () => void
  onReplay: () => void
  recommendedNext?: {
    label: string
    onSelect: () => void
  }
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function points(value: number) {
  return Number(value.toFixed(1)).toString()
}

export function CaseResults({
  caseDoc,
  caseLab,
  result,
  activityResult,
  clues,
  clueReview,
  starThresholds,
  onCompare,
  onContinue,
  onReplay,
  recommendedNext,
}: CaseResultsProps) {
  const { appConfig } = useContent()
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const { breakdown } = result
  const stars = starsForScore(breakdown.total, starThresholds)
  const badgeLabels = activityResult?.badgesUnlocked.map(
    (id) => appConfig.badges.find((badge) => badge.id === id)?.title ?? 'Awarded badge',
  )
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
  const missedStep = result.stepResults.find(({ firstAttemptScore }) => firstAttemptScore < 1)
  const missedStepDetail = missedStep ? stepLabels.get(missedStep.primitiveId) : undefined
  const unreviewedEvidence = evidenceItems.find(({ reviewed }) => reviewed === false)
  const takeaway = unreviewedEvidence
    ? {
        title: `Review ${unreviewedEvidence.label}`,
        detail: unreviewedEvidence.entry.why,
        reviewIndex: unreviewedEvidence.index,
      }
    : missedStep && missedStepDetail
      ? {
          title: missedStepDetail.label,
          detail:
            caseDoc.expertBenchmark.rationales[missedStep.primitiveId] ?? caseDoc.debrief.summary,
          reviewIndex: null,
        }
      : {
          title: caseDoc.expertBenchmark.path[0]!.label,
          detail: caseDoc.expertBenchmark.path[0]!.detail,
          reviewIndex: null,
        }
  const outcome =
    breakdown.total >= 90
      ? 'Mission accomplished'
      : breakdown.total >= 70
        ? 'Case completed'
        : 'Review and retry'

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <p className="text-small font-semibold text-success-700">Case complete</p>
      <h1 className="mt-2 text-display font-bold text-neutral-950">{outcome}</h1>
      <p className="mt-2 text-neutral-700">{caseDoc.title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>{formatCaseTier(caseLab, caseDoc.tier)}</Chip>
        <Chip>{formatCaseOrganSystem(caseLab, caseDoc.organSystem)}</Chip>
        <Chip tone="brand">{formatScore(breakdown.total)}</Chip>
        <Chip>{formatDuration(breakdown.durationSeconds)}</Chip>
      </div>
      <div className="mt-3">
        <CompletionMetrics
          awardedXp={result.actualAwardedXp}
          badgeLabels={badgeLabels}
          masteryDelta={activityResult?.masteryDelta}
          stars={stars}
        />
      </div>
      <p className="mt-4 text-small text-neutral-600">
        This score uses your first submitted response for each scored task; retries support learning
        but do not replace the scored response.
      </p>

      <details className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-card">
        <summary className="cursor-pointer p-4 font-semibold text-neutral-900 focus-visible:outline-2">
          Score details
        </summary>
        <div className="border-t border-neutral-200 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
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
                <div className="rounded-lg bg-neutral-50 p-3" key={label}>
                  <dl>
                    <dt className="text-small text-neutral-600">{label}</dt>
                    <dd className="mt-1 text-title font-bold text-neutral-950">
                      {notScored ? 'Not scored' : unavailable ? 'Unavailable' : percent(value)}
                    </dd>
                  </dl>
                  {weight !== undefined ? (
                    <p className="mt-1 text-small text-neutral-600">
                      {percent(weight)} weight · {points(value * weight * 100)} points
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
          {completeBreakdown ? (
            <>
              {breakdown.speedModel === 'time_eligible' && breakdown.speedEligibility ? (
                <p className="mt-4 text-small text-neutral-600">
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
            </>
          ) : (
            <p className="mt-4 text-small text-neutral-700">
              Detailed speed, weighting, clue cost and reward data are unavailable for this legacy
              attempt.
            </p>
          )}
        </div>
      </details>

      <Card className="mt-5">
        <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
          Key takeaway
        </p>
        <h2 className="mt-2 text-heading font-bold text-neutral-950">{takeaway.title}</h2>
        <p className="mt-3 text-neutral-700">{takeaway.detail}</p>
        {takeaway.reviewIndex !== null ? (
          <Button
            className="mt-4"
            size="sm"
            variant="secondary"
            onClick={() => setReviewIndex(takeaway.reviewIndex)}
          >
            Review this evidence
          </Button>
        ) : null}
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
            <p className="text-small font-semibold text-neutral-600">Observed finding</p>
            <p className="mt-2 text-neutral-800">{selectedEvidence.finding.description}</p>
          </div>
        ) : null}
      </Sheet>

      <Card className="mt-5">
        <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
          Recommended next
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {recommendedNext ? (
            <Button
              leadingIcon={<ArrowRight aria-hidden="true" size={18} />}
              onClick={recommendedNext.onSelect}
            >
              {recommendedNext.label}
            </Button>
          ) : (
            <Button
              leadingIcon={<RotateCcw aria-hidden="true" size={18} />}
              onClick={onReplay}
            >
              Replay case
            </Button>
          )}
          <Button
            leadingIcon={<Scale aria-hidden="true" size={18} />}
            variant="secondary"
            onClick={() => onCompare()}
          >
            Compare with model answer
          </Button>
          <Button variant="ghost" onClick={onContinue}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  )
}
