import { ArrowLeft, Flame, Medal } from 'lucide-react'
import { useEffect } from 'react'
import { useMatches, useNavigate, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { OfflineIndicator } from '@/components/feedback/OfflineIndicator'
import { IconButton } from '@/components/ui'
import { useLearnerStore } from '@/state/learnerStore'

interface RouteHandle {
  title?: string
}

export function PageHeader({ immersive = false }: { immersive?: boolean }) {
  const { appConfig, courseById, lessonById } = useContent()
  const matches = useMatches()
  const navigate = useNavigate()
  const { courseId, lessonId, pathwayId, challengeId } = useParams()
  const xp = useLearnerStore((state) => state.xp.total)
  const streak = useLearnerStore((state) => state.streak.currentDays)
  const matchedTitle = [...matches]
    .reverse()
    .map(({ handle }) => (handle as RouteHandle | undefined)?.title)
    .find(Boolean)
  const entityTitle =
    (lessonId ? lessonById.get(lessonId)?.title : undefined) ??
    (courseId ? courseById.get(courseId)?.title : undefined) ??
    (pathwayId ? appConfig.pathways.find(({ id }) => id === pathwayId)?.title : undefined) ??
    (challengeId ? appConfig.challenges.find(({ id }) => id === challengeId)?.title : undefined)
  const title = entityTitle ?? matchedTitle ?? appConfig.app.name
  const nested = Boolean(courseId || pathwayId || lessonId || challengeId)

  useEffect(() => {
    document.title = `${title} · ${appConfig.app.name}`
  }, [appConfig.app.name, title])

  return (
    <header
      className="sticky top-0 z-20 border-b border-neutral-200/80 bg-neutral-50/90 backdrop-blur-lg"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {nested ? (
            <IconButton
              icon={<ArrowLeft aria-hidden="true" size={20} />}
              label="Go back"
              onClick={() => navigate(-1)}
            />
          ) : null}
          <div className="min-w-0">
            {!immersive ? (
              <p className="text-caption font-semibold tracking-wide text-brand-700 uppercase">
                Axiom
              </p>
            ) : null}
            <p className="truncate font-bold text-neutral-900">{title}</p>
          </div>
        </div>
        {!immersive ? (
          <div className="flex items-center gap-3 text-small font-semibold" aria-label="Learner status">
            <OfflineIndicator />
            <span className="flex items-center gap-1 text-xp">
              <Medal aria-hidden="true" size={17} /> {xp.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-streak">
              <Flame aria-hidden="true" size={17} /> {streak}
            </span>
          </div>
        ) : null}
      </div>
    </header>
  )
}
