import { Link, useNavigate, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CasePlayer } from '@/player/case/CasePlayer'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCaseLabCards } from '@/state/selectors'

export function CasePlayerPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const registry = useContent()
  const caseProgress = useLearnerStore((state) => state.caseProgress)
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const caseView = caseId
    ? selectCaseLabCards({ caseProgress, caseAttempts }, registry).find(
        (candidate) => candidate.caseId === caseId,
      )
    : undefined

  if (!caseView || !registry.appConfig.caseLab) {
    return (
      <EmptyState
        title="Case unavailable"
        message="This case is not configured in Case Lab."
        action={<Link to="/learn">Return to Learn</Link>}
      />
    )
  }

  const caseDoc = caseView.caseDoc
  return (
    <CasePlayer
      anatomyMap={registry.anatomyMapById.get(caseDoc.anatomyMapId)}
      attemptHistory={caseAttempts[caseDoc.id] ?? []}
      caseDoc={caseDoc}
      config={registry.appConfig}
      continuePath={`/learn/cases/${caseDoc.id}`}
      exitPath={`/learn/cases/${caseDoc.id}`}
      previousAttempts={caseView.attempts}
      previousBestScore={caseView.bestScore}
      onComplete={({ attemptId }) =>
        navigate(`/learn/cases/${caseDoc.id}/attempts/${encodeURIComponent(attemptId)}`, {
          replace: true,
        })
      }
    />
  )
}
