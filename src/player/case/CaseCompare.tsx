import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'

import { Button, Card, Chip } from '@/components/ui'
import type { CaseDocument, CaseLabConfig, RecordedOpponent } from '@/content/schema'
import {
  formatCaseOrganSystem,
  formatCaseTier,
  formatDuration,
  formatScore,
} from '@/engines/cases/formatters'
import { caseResponsesEqual } from '@/engines/cases/responses'
import type { CaseAttemptHistoryItem, CaseResultPresentation } from '@/player/case/types'
import { resolvePrimitiveDefinition } from '@/primitives/definitions'

interface CaseCompareProps {
  caseDoc: CaseDocument
  caseLab: CaseLabConfig
  result: CaseResultPresentation
  history: readonly CaseAttemptHistoryItem[]
  historyLimit: number
  evidenceAnchor?: string | null
  opponent?: RecordedOpponent
  onBack: () => void
  onContinue: () => void
  onReplay: () => void
}

function percentage(value: number) {
  return `${Math.round(value * 100)}%`
}

export function CaseCompare({
  caseDoc,
  caseLab,
  result,
  history,
  historyLimit,
  evidenceAnchor,
  opponent,
  onBack,
  onContinue,
  onReplay,
}: CaseCompareProps) {
  useEffect(() => {
    if (!evidenceAnchor) return
    const target = document.getElementById(evidenceAnchor)
    target?.scrollIntoView?.({ block: 'center' })
    target?.focus()
  }, [evidenceAnchor])

  const recent = history
    .filter(({ attemptId }) => attemptId !== result.attemptId)
    .slice(-historyLimit)
  const best = recent.length
    ? Math.max(...recent.map(({ total }) => total), result.breakdown.total)
    : result.breakdown.total
  const stepIndexes = new Map(
    caseDoc.stages.flatMap(({ steps }) => steps).map(({ id }, index) => [id, index]),
  )
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
  const comparisonBreakdown = opponent?.breakdown ?? caseDoc.expertBenchmark.breakdown
  const comparisonLabel = opponent?.name ?? 'Model answer'
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
  const weightedEvidence = caseDoc.expertBenchmark.evidenceWeights.flatMap((evidence, index) => {
    const clue =
      evidence.ref.kind === 'clue'
        ? caseDoc.clues.find(({ id }) => id === evidence.ref.id)
        : undefined
    const finding =
      evidence.ref.kind === 'finding'
        ? caseDoc.findings?.find(({ id }) => id === evidence.ref.id)
        : undefined
    if (!clue && !finding) return []
    const reviewed =
      evidence.ref.kind === 'clue'
        ? result.reviewedClueIds === undefined
          ? null
          : result.reviewedClueIds.includes(evidence.ref.id)
        : inspectedFindingIds.has(evidence.ref.id)
    return [{ evidence, index, label: clue?.title ?? finding!.label, reviewed }]
  })
  const expertDifferentialId = caseDoc.differential?.find(({ id }) =>
    Object.values(caseDoc.expertBenchmark.responses).some((response) => response === id),
  )?.id
  const differentialCheckpoints = Object.entries(result.differentialCheckpoints ?? {}).map(
    ([stepId, ratings], index) => ({
      label:
        caseDoc.stages.find(({ steps }) => steps.some(({ id }) => id === stepId))?.title ??
        `Checkpoint ${index + 1}`,
      ratings,
    }),
  )

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
      <Button
        leadingIcon={<ArrowLeft aria-hidden="true" size={18} />}
        variant="ghost"
        onClick={onBack}
      >
        Back to results
      </Button>
      <p className="mt-5 text-small font-semibold text-brand-700">
        {opponent ? 'Recorded-opponent challenge' : 'Model answer'}
      </p>
      <h1 className="mt-2 text-display font-bold text-neutral-950">{caseDoc.title}</h1>
      <p className="mt-3 max-w-2xl text-neutral-700">
        {opponent
          ? `Compare your completed attempt with ${opponent.name}'s prerecorded result. No live learner or multiplayer service is connected.`
          : 'This is one authored reasoning route for comparison, not the only valid way to approach the case.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {opponent ? <Chip tone="brand">Simulated data</Chip> : null}
        <Chip>{formatCaseTier(caseLab, caseDoc.tier)}</Chip>
        <Chip>{formatCaseOrganSystem(caseLab, caseDoc.organSystem)}</Chip>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="text-heading font-bold text-neutral-950">
            You versus {comparisonLabel}
          </h2>
          <p className="mt-2 text-small text-neutral-600">
            {opponent
              ? `${opponent.role} · recorded ${new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(opponent.recordedAt))}`
              : `Prepared as ${caseDoc.expertBenchmark.name}.`}
          </p>
          <dl className="mt-5 space-y-4">
            {[
              ['Anatomy', result.breakdown.anatomy, comparisonBreakdown.anatomy],
              [
                'Diagnosis',
                result.breakdown.diagnosis,
                comparisonBreakdown.diagnosis,
              ],
              ['Speed', result.breakdown.speed, comparisonBreakdown.speed],
            ].map(([label, learner, expert]) => (
              <div
                className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto] sm:gap-4"
                key={label as string}
              >
                <dt className="font-semibold text-neutral-800">{label}</dt>
                <dd className="text-right text-small">
                  <span className="block text-neutral-500">You</span>
                  {label === 'Speed'
                    ? speedValue(learner as number)
                    : percentage(learner as number)}
                </dd>
                <dd className="text-right text-small">
                  <span className="block text-neutral-500">{comparisonLabel}</span>
                  {label === 'Speed' && !opponent
                    ? speedValue(expert as number)
                    : percentage(expert as number)}
                </dd>
              </div>
            ))}
            <div className="grid min-w-0 grid-cols-1 gap-2 border-t border-neutral-200 pt-4 sm:grid-cols-[1fr_auto_auto] sm:gap-4">
              <dt className="font-semibold text-neutral-800">Time</dt>
              <dd className="text-right text-small">
                {formatDuration(result.breakdown.durationSeconds)}
              </dd>
              <dd className="text-right text-small">
                {formatDuration(
                  opponent?.breakdown.durationSeconds ??
                    caseDoc.expertBenchmark.durationSeconds,
                )}
              </dd>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto] sm:gap-4">
              <dt className="font-semibold text-neutral-800">Clues</dt>
              <dd className="text-right text-small">{result.breakdown.openedClueIds.length}</dd>
              <dd className="text-right text-small">
                {opponent?.breakdown.openedClueCount ??
                  caseDoc.expertBenchmark.openedClueIds.length}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-heading font-bold text-neutral-950">
            {opponent ? 'Head-to-head result' : 'Your history'}
          </h2>
          {opponent ? (
            <>
              <p className="mt-2 text-small text-neutral-600">
                Recorded result: {formatScore(opponent.breakdown.total)}
              </p>
              <div className="mt-5 space-y-3">
                {[
                  ['You', result.breakdown.total, 'bg-brand-700'],
                  [opponent.name, opponent.breakdown.total, 'bg-info-600'],
                ].map(([label, total, color]) => (
                  <div className="flex items-center gap-3" key={label as string}>
                    <span className="w-24 text-small font-semibold text-neutral-700">
                      {label as string}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full ${color as string}`}
                        style={{ width: `${total as number}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-semibold">
                      {formatScore(total as number)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-small text-neutral-600">Best score: {formatScore(best)}</p>
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
                  <span className="w-14 text-right font-semibold">
                    {formatScore(attempt.total)}
                  </span>
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
                <span className="w-14 text-right font-semibold">
                  {formatScore(result.breakdown.total)}
                </span>
              </li>
            </ol>
          ) : (
            <p className="mt-5 rounded-lg bg-neutral-100 p-4 text-small text-neutral-700">
              This is your first recorded attempt. Complete this case again to compare your next
              result.
            </p>
              )}
            </>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        {opponent ? (
          <p className="mb-5 text-small font-semibold text-brand-700">Model answer debrief</p>
        ) : null}
        <section aria-labelledby="expert-path-heading">
          <h2 className="text-heading font-bold text-neutral-950" id="expert-path-heading">
            How the model answer approached it
          </h2>
          <ol className="mt-4 space-y-3">
            {caseDoc.expertBenchmark.path.map(({ label, detail }, index) => (
              <li className="flex gap-3" key={label}>
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-caption font-bold text-brand-800"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900">{label}</p>
                  <p className="mt-1 text-small text-neutral-700">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="mt-7 border-t border-neutral-200 pt-6"
          aria-labelledby="evidence-heading"
        >
          <h2 className="text-heading font-bold text-neutral-950" id="evidence-heading">
            Clues and spatial findings that mattered
          </h2>
          <ul className="mt-4 space-y-3">
            {weightedEvidence.map(({ evidence, index, label, reviewed }) => (
              <li
                className="rounded-lg border border-neutral-200 p-4 focus-visible:outline-2"
                id={`expert-evidence-${index}`}
                key={index}
                tabIndex={-1}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-neutral-950">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip>{evidence.weight[0]!.toUpperCase() + evidence.weight.slice(1)}</Chip>
                    <Chip tone={reviewed ? 'success' : 'neutral'}>
                      {reviewed === null
                        ? 'Status unavailable'
                        : evidence.ref.kind === 'clue'
                          ? reviewed
                            ? 'Reviewed'
                            : 'Not reviewed'
                          : reviewed
                            ? 'Inspected'
                            : 'Not inspected'}
                    </Chip>
                  </div>
                </div>
                <p className="mt-2 text-small text-neutral-700">{evidence.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="mt-7 border-t border-neutral-200 pt-6"
          aria-labelledby="reasoning-heading"
        >
          <h2 className="text-heading font-bold text-neutral-950" id="reasoning-heading">
            Differential evolution
          </h2>
          {caseDoc.differential?.length ? (
            <ul className="mt-4 space-y-2">
              {caseDoc.differential.map((hypothesis) => (
                <li
                  className="rounded-lg bg-neutral-50 p-3"
                  key={hypothesis.id}
                >
                  <p className="font-semibold text-neutral-900">{hypothesis.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-small text-neutral-700">
                    {differentialCheckpoints.map(({ label, ratings }) => (
                      <Chip key={`${hypothesis.id}:${label}`}>
                        {label}: {ratings[hypothesis.id] ?? 'Not rated'}
                      </Chip>
                    ))}
                    {!differentialCheckpoints.length ? (
                      <Chip>You: {result.differential?.[hypothesis.id] ?? 'Not rated'}</Chip>
                    ) : null}
                    <Chip tone={expertDifferentialId === hypothesis.id ? 'brand' : 'neutral'}>
                      Model answer: {expertDifferentialId === hypothesis.id ? 'leading' : 'alternative'}
                    </Chip>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-neutral-700">{caseDoc.expertBenchmark.diagnosisRationale}</p>
        </section>

        <section className="mt-7 border-t border-neutral-200 pt-6" aria-labelledby="steps-heading">
          <h2 className="text-heading font-bold text-neutral-950" id="steps-heading">
            Step-by-step comparison
          </h2>
          <ul className="mt-3 space-y-2 text-small">
            {scoredStepResults.map((step) => {
              const expertResponse = caseDoc.expertBenchmark.responses[step.primitiveId]
              const authored = authoredSteps.get(step.primitiveId)!
              const matched =
                expertResponse !== undefined && caseResponsesEqual(expertResponse, step.response)
              return (
                <li
                  className="rounded-lg bg-neutral-50 p-3"
                  id={`expert-step-${stepIndexes.get(step.primitiveId) ?? 0}`}
                  key={step.primitiveId}
                >
                  <div className="flex min-w-0 flex-wrap justify-between gap-3">
                    <span className="min-w-0 text-neutral-700">{authored.label}</span>
                    <span
                      className={`min-w-0 ${matched ? 'text-success-700' : 'text-warning-700'}`}
                    >
                      {matched
                        ? 'Matched model answer'
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
