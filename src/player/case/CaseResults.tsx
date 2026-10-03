import { RotateCcw, Scale } from 'lucide-react'

import { Button, Card, Chip } from '@/components/ui'
import type { CaseClue, CaseDocument } from '@/content/schema'
import { starsForScore } from '@/engines/gamification/stars'
import type { CaseResultPresentation } from '@/player/case/types'

interface CaseResultsProps {
  caseDoc: CaseDocument
  result: CaseResultPresentation
  clues: readonly CaseClue[]
  starThresholds: { one: number; two: number; three: number }
  onCompare: () => void
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
  starThresholds,
  onCompare,
  onContinue,
  onReplay,
}: CaseResultsProps) {
  const { breakdown } = result
  const stars = starsForScore(breakdown.total, starThresholds)
  const completeBreakdown =
    breakdown.weights !== undefined &&
    breakdown.clueCostPoints !== undefined &&
    breakdown.speedScored !== undefined
  const reviewedClueIds = result.reviewedClueIds ?? []
  const missedDebriefClues = caseDoc.debrief.keyClueIds
    .filter((id) => !reviewedClueIds.includes(id))
    .flatMap((id) => {
      const clue = clues.find((candidate) => candidate.id === id)
      return clue ? [clue] : []
    })

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
        {missedDebriefClues.length ? (
          <div className="mt-4">
            <h3 className="font-semibold text-neutral-900">Key evidence not reviewed</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-neutral-700">
              {missedDebriefClues.map((clue) => (
                <li key={clue.id}>{clue.title}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button leadingIcon={<Scale aria-hidden="true" size={18} />} onClick={onCompare}>
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
