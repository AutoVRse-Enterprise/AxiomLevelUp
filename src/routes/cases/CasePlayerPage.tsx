import { Link, useNavigate, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCasePackage, offlinePackageKey } from '@/offline/package'
import { isCaseOfflineReady } from '@/offline/readiness'
import { CasePlayer } from '@/player/case/CasePlayer'
import { useConnectivity } from '@/pwa/connectivity'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCaseLabCards } from '@/state/selectors'

export function CasePlayerPage() {
  const { caseId } = useParams()
  const navigate = useNavigate()
  const registry = useContent()
  const { online } = useConnectivity()
  const caseProgress = useLearnerStore((state) => state.caseProgress)
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const caseView = caseId
    ? selectCaseLabCards({ caseProgress, caseAttempts }, registry).find(
        (candidate) => candidate.caseId === caseId,
      )
    : undefined
  const anatomyMap = caseView
    ? registry.anatomyMapById.get(caseView.caseDoc.anatomyMapId)
    : undefined
  const offlinePackage =
    caseView && anatomyMap
      ? buildCasePackage(
          caseView.caseDoc,
          anatomyMap,
          registry,
          import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
        )
      : undefined
  const offlineRecord = useOfflineLibraryStore((state) =>
    offlinePackage
      ? state.records[offlinePackageKey(offlinePackage.kind, offlinePackage.id)]
      : undefined,
  )

  if (!caseView || !registry.appConfig.caseLab) {
    return (
      <EmptyState
        title="Case unavailable"
        message="This case is unavailable or may have moved."
        action={<Link to="/learn">Return to Learn</Link>}
      />
    )
  }

  const caseDoc = caseView.caseDoc
  if (!online && (!offlinePackage || !isCaseOfflineReady(offlinePackage, offlineRecord))) {
    return (
      <EmptyState
        title="This case has not been downloaded"
        message="Connect to the internet or choose a case available offline."
        action={<Link to={`/learn/cases/${caseDoc.id}`}>Return to case overview</Link>}
      />
    )
  }

  return (
    <CasePlayer
      anatomyMap={anatomyMap}
      attemptHistory={caseAttempts[caseDoc.id] ?? []}
      autoStartOrResume
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
