import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CaseCompare } from '@/player/case/CaseCompare'
import { CaseResults } from '@/player/case/CaseResults'
import { presentCaseAttemptRecord } from '@/player/case/types'
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
  const result = presentCaseAttemptRecord(caseId, attempt)
  const introPath = `/learn/cases/${caseId}`
  const playPath = `${introPath}/play`

  return searchParams.get('view') === 'compare' ? (
    <CaseCompare
      caseDoc={caseDoc}
      history={comparison.history}
      historyLimit={caseLab.historyLimit}
      evidenceAnchor={searchParams.get('evidence')}
      result={result}
      onBack={() => setSearchParams({})}
      onContinue={() => navigate(introPath)}
      onReplay={() => navigate(playPath)}
    />
  ) : (
    <CaseResults
      caseDoc={caseDoc}
      clues={caseDoc.clues}
      clueReview={caseLab.clueReview}
      result={result}
      starThresholds={registry.appConfig.gamification.stars}
      onCompare={(evidence) =>
        setSearchParams(evidence ? { view: 'compare', evidence } : { view: 'compare' })
      }
      onContinue={() => navigate(introPath)}
      onReplay={() => navigate(playPath)}
    />
  )
}
