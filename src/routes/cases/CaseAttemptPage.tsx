import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { CaseScoreBreakdown } from '@/engines/cases/scoring'
import { CaseCompare } from '@/player/case/CaseCompare'
import { CaseResults } from '@/player/case/CaseResults'
import type { CaseAttemptResult } from '@/player/case/types'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCaseCompare, selectCaseResults } from '@/state/selectors'

export function CaseAttemptPage() {
  const { caseId, attemptId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const registry = useContent()
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const selected = attemptId ? selectCaseResults({ caseAttempts }, attemptId) : null
  const comparison =
    caseId && attemptId ? selectCaseCompare({ caseAttempts }, caseId, attemptId) : null
  const caseDoc = caseId ? registry.caseById.get(caseId) : undefined
  const caseLab = registry.appConfig.caseLab

  if (!caseDoc || !caseLab || !selected || selected.caseId !== caseId || !comparison) {
    return (
      <EmptyState
        title="Attempt not found"
        message="This saved Case Lab attempt is unavailable."
        action={<Link to={caseId ? `/learn/cases/${caseId}` : '/learn'}>Return to Case Lab</Link>}
      />
    )
  }

  const attempt = selected.attempt
  const optionalClueIds = new Set(
    caseDoc.clues.filter(({ essential }) => !essential).map(({ id }) => id),
  )
  const optionalOpened = new Set(
    attempt.openedClueIds.filter((clueId) => optionalClueIds.has(clueId)),
  ).size
  const penalty = Math.min(
    caseLab.scoring.cluePenalty.cap,
    optionalOpened * caseLab.scoring.cluePenalty.perOptionalClue,
  )
  const breakdown: CaseScoreBreakdown = {
    anatomy: attempt.anatomy,
    diagnosis: attempt.diagnosis,
    speed: attempt.speed,
    perStepSpeed: attempt.speed,
    caseSpeed: attempt.speed,
    penalty,
    total: attempt.total,
    weights: caseLab.scoring.weights,
    durationSeconds: attempt.durationSeconds,
    openedClueIds: attempt.openedClueIds,
  }
  const result: CaseAttemptResult = {
    caseId,
    attemptId: attempt.attemptId,
    breakdown,
    stepResults: attempt.stepResults,
    completedAt: attempt.completedAt,
  }
  const introPath = `/learn/cases/${caseId}`
  const playPath = `${introPath}/play`

  return searchParams.get('view') === 'compare' ? (
    <CaseCompare
      caseDoc={caseDoc}
      history={comparison.history}
      historyLimit={caseLab.historyLimit}
      result={result}
      onBack={() => setSearchParams({})}
      onContinue={() => navigate(introPath)}
      onReplay={() => navigate(playPath)}
    />
  ) : (
    <CaseResults
      caseDoc={caseDoc}
      clues={caseDoc.clues}
      completionXp={caseLab.xp.caseComplete}
      result={result}
      starThresholds={registry.appConfig.gamification.stars}
      onCompare={() => setSearchParams({ view: 'compare' })}
      onContinue={() => navigate(introPath)}
      onReplay={() => navigate(playPath)}
    />
  )
}
