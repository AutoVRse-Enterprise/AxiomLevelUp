import { RotateCcw, Scale } from 'lucide-react'

import { Button, Card, Chip } from '@/components/ui'
import type { CaseClue, CaseDocument } from '@/content/schema'
import { starsForScore } from '@/engines/gamification/stars'
import type { CaseAttemptResult } from '@/player/case/types'

interface CaseResultsProps {
  caseDoc: CaseDocument
  result: CaseAttemptResult
  clues: readonly CaseClue[]
  starThresholds: { one: number; two: number; three: number }
  completionXp: number
  onCompare: () => void
  onContinue: () => void
  onReplay: () => void
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function CaseResults({
  caseDoc,
  result,
  clues,
  starThresholds,
  completionXp,
  onCompare,
  onContinue,
  onReplay,
}: CaseResultsProps) {
  const { breakdown } = result
  const stars = starsForScore(breakdown.total, starThresholds)
  const missedDebriefClues = caseDoc.debrief.keyClueIds
    .filter((id) => !breakdown.openedClueIds.includes(id))
    .flatMap((id) => {
      const clue = clues.find((candidate) => candidate.id === id)
      return clue ? [clue] : []
    })

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <p className="text-small font-semibold text-success-700">Case complete</p>
      <h1 className="mt-2 text-display font-bold text-neutral-950">{caseDoc.title}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip tone="brand">{breakdown.total} points</Chip>
        <Chip>
          {'★'.repeat(stars)}
          {'☆'.repeat(3 - stars)}
        </Chip>
        <Chip>{Math.round(breakdown.durationSeconds)} sec</Chip>
        <Chip>{completionXp} completion XP</Chip>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['Anatomy', breakdown.anatomy],
          ['Diagnosis', breakdown.diagnosis],
          ['Speed', breakdown.speed],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <dt className="text-small text-neutral-600">{label}</dt>
            <dd className="mt-1 text-title font-bold text-neutral-950">
              {percent(value as number)}
            </dd>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-brand-700"
                style={{ width: percent(value as number) }}
              />
            </div>
          </Card>
        ))}
      </dl>

      <Card className="mt-5">
        <h2 className="text-heading font-bold text-neutral-950">Score details</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-small sm:grid-cols-4">
          <div>
            <dt className="text-neutral-600">Step speed</dt>
            <dd className="font-semibold">{percent(breakdown.perStepSpeed)}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Case speed</dt>
            <dd className="font-semibold">{percent(breakdown.caseSpeed)}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Clues opened</dt>
            <dd className="font-semibold">{breakdown.openedClueIds.length}</dd>
          </div>
          <div>
            <dt className="text-neutral-600">Clue penalty</dt>
            <dd className="font-semibold">−{breakdown.penalty}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-5">
        <h2 className="text-heading font-bold text-neutral-950">Debrief</h2>
        <p className="mt-3 text-neutral-700">{caseDoc.debrief.summary}</p>
        {missedDebriefClues.length ? (
          <div className="mt-4">
            <h3 className="font-semibold text-neutral-900">Key evidence not opened</h3>
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
    </main>
  )
}
