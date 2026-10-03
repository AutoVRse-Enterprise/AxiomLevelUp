import { ArrowLeft, RotateCcw } from 'lucide-react'

import { Button, Card } from '@/components/ui'
import type { CaseDocument } from '@/content/schema'
import { caseResponsesEqual } from '@/engines/cases/responses'
import type { CaseAttemptHistoryItem, CaseResultPresentation } from '@/player/case/types'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'

interface CaseCompareProps {
  caseDoc: CaseDocument
  result: CaseResultPresentation
  history: readonly CaseAttemptHistoryItem[]
  historyLimit: number
  onBack: () => void
  onContinue: () => void
  onReplay: () => void
}

function percentage(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatDuration(seconds: number) {
  const roundedSeconds = Math.max(0, Math.round(seconds))
  return `${Math.floor(roundedSeconds / 60)}:${String(roundedSeconds % 60).padStart(2, '0')}`
}

export function CaseCompare({
  caseDoc,
  result,
  history,
  historyLimit,
  onBack,
  onContinue,
  onReplay,
}: CaseCompareProps) {
  const recent = history
    .filter(({ attemptId }) => attemptId !== result.attemptId)
    .slice(-historyLimit)
  const best = recent.length
    ? Math.max(...recent.map(({ total }) => total), result.breakdown.total)
    : result.breakdown.total
  const authoredSteps = new Map(
    caseDoc.stages.flatMap(({ steps }) =>
      steps.flatMap((step) => {
        const resolved = resolvePrimitiveDefinition(step)
        if (!resolved || !resolved.definition.scored(resolved.primitive)) return []
        return [
          [
            step.id,
            {
              label: resolved.definition.reviewPrompt(resolved.primitive),
              rationale: caseDoc.expertBenchmark.rationales?.[step.id],
            },
          ] as const,
        ]
      }),
    ),
  )
  const scoredStepResults = result.stepResults.filter(({ primitiveId }) =>
    authoredSteps.has(primitiveId),
  )
  const speedValue = (value: number) =>
    result.breakdown.speedScored === false
      ? 'Not scored'
      : result.breakdown.speedScored === true
        ? percentage(value)
        : 'Unavailable'

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
      <Button
        leadingIcon={<ArrowLeft aria-hidden="true" size={18} />}
        variant="ghost"
        onClick={onBack}
      >
        Back to results
      </Button>
      <p className="mt-5 text-small font-semibold text-brand-700">Attempt comparison</p>
      <h1 className="mt-2 text-display font-bold text-neutral-950">{caseDoc.title}</h1>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-heading font-bold text-neutral-950">
            You versus {caseDoc.expertBenchmark.name}
          </h2>
          <dl className="mt-5 space-y-4">
            {[
              ['Anatomy', result.breakdown.anatomy, caseDoc.expertBenchmark.breakdown.anatomy],
              [
                'Diagnosis',
                result.breakdown.diagnosis,
                caseDoc.expertBenchmark.breakdown.diagnosis,
              ],
              ['Speed', result.breakdown.speed, caseDoc.expertBenchmark.breakdown.speed],
            ].map(([label, learner, expert]) => (
              <div className="grid grid-cols-[1fr_auto_auto] gap-4" key={label as string}>
                <dt className="font-semibold text-neutral-800">{label}</dt>
                <dd className="text-right text-small">
                  <span className="block text-neutral-500">You</span>
                  {label === 'Speed'
                    ? speedValue(learner as number)
                    : percentage(learner as number)}
                </dd>
                <dd className="text-right text-small">
                  <span className="block text-neutral-500">Expert</span>
                  {label === 'Speed' ? speedValue(expert as number) : percentage(expert as number)}
                </dd>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-t border-neutral-200 pt-4">
              <dt className="font-semibold text-neutral-800">Time</dt>
              <dd className="text-right text-small">
                {formatDuration(result.breakdown.durationSeconds)}
              </dd>
              <dd className="text-right text-small">
                {formatDuration(caseDoc.expertBenchmark.durationSeconds)}
              </dd>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-4">
              <dt className="font-semibold text-neutral-800">Clues</dt>
              <dd className="text-right text-small">{result.breakdown.openedClueIds.length}</dd>
              <dd className="text-right text-small">
                {caseDoc.expertBenchmark.openedClueIds.length}
              </dd>
            </div>
          </dl>
          <section className="mt-6 border-t border-neutral-200 pt-5">
            <h3 className="font-semibold text-neutral-900">Step differences</h3>
            <ul className="mt-3 space-y-2 text-small">
              {scoredStepResults.map((step) => {
                const expertResponse = caseDoc.expertBenchmark.responses[step.primitiveId]
                const authored = authoredSteps.get(step.primitiveId)!
                const matched =
                  expertResponse !== undefined && caseResponsesEqual(expertResponse, step.response)
                return (
                  <li className="rounded-lg bg-neutral-50 p-3" key={step.primitiveId}>
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-700">{authored.label}</span>
                      <span className={matched ? 'text-success-700' : 'text-warning-700'}>
                        {matched
                          ? 'Matched expert'
                          : `${Math.round(step.firstAttemptScore * 100)}%`}
                      </span>
                    </div>
                    {authored.rationale ? (
                      <p className="mt-2 text-neutral-600">{authored.rationale}</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-small text-neutral-600">
              Comparisons use the first submitted response for each scored task. Retries are not
              substituted.
            </p>
          </section>
        </Card>

        <Card>
          <h2 className="text-heading font-bold text-neutral-950">Your history</h2>
          <p className="mt-2 text-small text-neutral-600">Best score: {best}/100</p>
          {recent.length ? (
            <ol className="mt-5 space-y-3" aria-label="Recent case attempts">
              {recent.map((attempt, index) => (
                <li className="flex items-center gap-3" key={attempt.attemptId}>
                  <span className="w-20 text-small text-neutral-600">Attempt {index + 1}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-brand-600"
                      style={{ width: `${attempt.total}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-semibold">{attempt.total}/100</span>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <span className="w-20 text-small font-semibold text-brand-700">Current</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-brand-700"
                    style={{ width: `${result.breakdown.total}%` }}
                  />
                </div>
                <span className="w-14 text-right font-semibold">{result.breakdown.total}/100</span>
              </li>
            </ol>
          ) : (
            <p className="mt-5 rounded-lg bg-neutral-100 p-4 text-small text-neutral-700">
              This is your first recorded attempt. Future attempt history is supplied by the case
              state pipeline.
            </p>
          )}
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={onContinue}>Continue</Button>
        <Button
          leadingIcon={<RotateCcw aria-hidden="true" size={18} />}
          variant="secondary"
          onClick={onReplay}
        >
          Replay
        </Button>
      </div>
    </div>
  )
}
