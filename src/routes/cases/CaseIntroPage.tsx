import { ArrowLeft, ArrowRight, CheckCircle2, History, RefreshCw, Stethoscope } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CaseOfflineControl } from '@/components/offline/CaseOfflineControl'
import { Card, Chip } from '@/components/ui'
import { useAssetUrl } from '@/content/useAssetUrl'
import { formatEstimatedMinutes, formatScore } from '@/engines/cases/formatters'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCasePackage, offlinePackageKey } from '@/offline/package'
import { isCaseOfflineReady } from '@/offline/readiness'
import { useConnectivity } from '@/pwa/connectivity'
import { prefetchVersionedModel, versionedModelUrl } from '@/pwa/modelCache'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCaseLabCards } from '@/state/selectors'

function caseRuleDetail(
  id: 'first_attempt' | 'optional_clues' | 'timing' | 'hints',
  caseLab: NonNullable<ReturnType<typeof useContent>['appConfig']['caseLab']>,
  tier: 'foundation' | 'intermediate' | 'advanced',
) {
  const preset = caseLab.tiers[tier]
  if (id === 'optional_clues') {
    const { cap, perOptionalClue } = caseLab.scoring.cluePenalty
    return `Each optional clue costs ${perOptionalClue} points, up to ${cap} points total.`
  }
  if (id === 'timing') {
    if (preset.timing === 'none') return `${preset.label}: untimed practice; speed is not scored.`
    if (preset.timing === 'stopwatch') {
      return `${preset.label}: a stopwatch tracks pace for the speed part of your score; time spent reviewing clues counts.`
    }
    return `${preset.label}: a countdown includes time spent reviewing clues, but you can continue when it reaches zero.`
  }
  if (id === 'hints') {
    return preset.hints === 'full'
      ? `${preset.label}: full hints are available.`
      : `${preset.label}: hints are available with reduced guidance.`
  }
  return null
}

function FeaturedModelPreflight({ modelUrl }: { modelUrl: string }) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')

  useEffect(() => {
    const controller = new AbortController()
    void prefetchVersionedModel(modelUrl, { signal: controller.signal }).then(
      () => setState('ready'),
      () => {
        if (!controller.signal.aborted) setState('failed')
      },
    )
    return () => controller.abort()
  }, [attempt, modelUrl])

  if (state === 'loading') {
    return (
      <p aria-live="polite" className="mt-3 text-small text-neutral-600" role="status">
        Preparing the exact 3D model for this case…
      </p>
    )
  }

  if (state === 'ready') {
    return (
      <p className="mt-3 flex items-center gap-2 text-small text-success-700" role="status">
        <CheckCircle2 aria-hidden="true" size={16} /> 3D model preloaded for this session.
      </p>
    )
  }

  return (
    <div className="mt-3 text-small text-warning-800" role="alert">
      <p>The 3D model could not be preloaded. You can still start the case.</p>
      <button
        className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700 underline"
        type="button"
        onClick={() => {
          setState('loading')
          setAttempt((current) => current + 1)
        }}
      >
        <RefreshCw aria-hidden="true" size={16} /> Retry model preload
      </button>
    </div>
  )
}

export function CaseIntroPage() {
  const { caseId } = useParams()
  const registry = useContent()
  const caseProgress = useLearnerStore((state) => state.caseProgress)
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const session = useActivitySessionStore((state) => state.session)
  const { online } = useConnectivity()
  const caseView = caseId
    ? selectCaseLabCards({ caseProgress, caseAttempts }, registry).find(
        (candidate) => candidate.caseId === caseId,
      )
    : undefined
  const patientImage = useAssetUrl(caseView?.caseDoc.patient.imageAssetId)
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
  const offlineReady =
    offlinePackage !== undefined && isCaseOfflineReady(offlinePackage, offlineRecord)
  const featuredModelUrl = (() => {
    if (!caseView || caseView.caseId !== registry.appConfig.caseLab?.featuredCaseId)
      return undefined
    const model = anatomyMap ? registry.assetById.get(anatomyMap.modelAssetId) : undefined
    return model?.type === 'model' ? versionedModelUrl(model) : undefined
  })()

  if (!caseView || !registry.appConfig.caseLab) {
    return (
      <EmptyState
        title="Case not found"
        message="This case is unavailable or may have moved."
        action={<Link to="/learn">Return to Learn</Link>}
      />
    )
  }

  const { caseDoc } = caseView
  const attempts = caseAttempts[caseDoc.id] ?? []
  const resumable =
    session?.activityKind === 'case' &&
    session.activityId === caseDoc.id &&
    session.startedAt !== null &&
    session.phase !== 'complete'
  const ctaClass =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800 focus-visible:outline-2'

  return (
    <div className="space-y-7">
      <Link className="inline-flex items-center gap-2 font-semibold text-brand-700" to="/learn">
        <ArrowLeft aria-hidden="true" size={17} /> Case Lab
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brand">{caseView.tierLabel}</Chip>
          {caseView.daily ? <Chip tone="success">Daily</Chip> : null}
          <Chip>{caseView.organSystemLabel}</Chip>
          <Chip>{formatEstimatedMinutes(caseDoc.estimatedMinutes)}</Chip>
        </div>
        <h1 className="mt-4 text-display font-bold">{caseDoc.title}</h1>
        <p className="mt-3 max-w-3xl text-neutral-600">{caseDoc.summary}</p>
      </header>

      <section aria-labelledby="case-how-it-works">
        <h2 className="text-heading font-bold" id="case-how-it-works">
          How this case works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {registry.appConfig.caseLab.howItWorks.map((step, index) => {
            const detail = caseRuleDetail(step.id, registry.appConfig.caseLab!, caseDoc.tier)
            return (
              <li className="rounded-xl border border-brand-100 bg-brand-50 p-4" key={step.id}>
                <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 font-bold text-neutral-950">{step.title}</h3>
                <p className="mt-2 text-small text-neutral-700">{step.description}</p>
                {detail ? (
                  <p className="mt-2 text-small font-semibold text-brand-900">{detail}</p>
                ) : null}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden p-0 sm:p-0">
          {patientImage ? (
            <img alt="" className="h-52 w-full object-cover" src={patientImage} />
          ) : null}
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-brand-700">
              <Stethoscope aria-hidden="true" size={20} />
              <p className="text-caption font-bold uppercase tracking-wide">Patient</p>
            </div>
            <h2 className="mt-3 text-title font-bold">{caseDoc.patient.label}</h2>
            {caseDoc.patient.age !== undefined || caseDoc.patient.sex ? (
              <p className="mt-1 text-small text-neutral-600">
                {[
                  caseDoc.patient.age === undefined ? null : `${caseDoc.patient.age} years`,
                  caseDoc.patient.sex,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
            <p className="mt-4 font-semibold text-neutral-900">
              {caseDoc.patient.presentingComplaint}
            </p>
            {caseDoc.patient.history.length ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-small text-neutral-700">
                {caseDoc.patient.history.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
              Your mission
            </p>
            <h2 className="mt-2 text-heading font-bold">{caseDoc.mission.objective}</h2>
            <p className="mt-3 text-small text-neutral-700">{caseDoc.mission.role}</p>
            <h3 className="mt-5 font-bold text-neutral-950">What you will deliver</h3>
            <ul className="mt-3 space-y-2 text-small text-neutral-700">
              {caseDoc.mission.deliverables.map((deliverable) => (
                <li className="flex gap-2" key={deliverable}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-brand-700"
                    size={17}
                  />
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-heading font-bold">Your progress</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-small text-neutral-600">Best score</dt>
                <dd className="text-title font-bold">
                  {caseView.bestScore === null ? '—' : formatScore(caseView.bestScore)}
                </dd>
              </div>
              <div>
                <dt className="text-small text-neutral-600">Attempts</dt>
                <dd className="text-title font-bold">{caseView.attempts}</dd>
              </div>
            </dl>
            {online || offlineReady ? (
              <Link className={`${ctaClass} mt-5 w-full`} to={`/learn/cases/${caseDoc.id}/play`}>
                {resumable ? 'Resume case' : 'Start case'}
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            ) : (
              <>
                <button className={`${ctaClass} mt-5 w-full opacity-60`} disabled type="button">
                  {resumable ? 'Resume case' : 'Start case'}
                  <ArrowRight aria-hidden="true" size={17} />
                </button>
                <p className="mt-2 text-small text-neutral-600">
                  Connect or download this case before starting offline.
                </p>
              </>
            )}
            {anatomyMap ? (
              <CaseOfflineControl anatomyMap={anatomyMap} caseDocument={caseDoc} />
            ) : null}
            {featuredModelUrl && online ? (
              <FeaturedModelPreflight modelUrl={featuredModelUrl} />
            ) : null}
          </Card>
        </div>
      </div>

      {attempts.length ? (
        <section aria-labelledby="case-history-heading">
          <h2 className="text-heading font-bold" id="case-history-heading">
            Attempt history
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...attempts].reverse().map((attempt) => (
              <Link
                className="rounded-lg focus-visible:outline-2"
                key={attempt.attemptId}
                to={`/learn/cases/${caseDoc.id}/attempts/${encodeURIComponent(attempt.attemptId)}`}
              >
                <Card className="h-full" interactive>
                  <History aria-hidden="true" className="text-brand-700" size={20} />
                  <p className="mt-3 font-bold">{formatScore(attempt.total)}</p>
                  <p className="mt-1 text-small text-neutral-600">
                    {new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                      new Date(attempt.completedAt),
                    )}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
