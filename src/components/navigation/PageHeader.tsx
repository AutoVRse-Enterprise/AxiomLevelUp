import { ArrowLeft, Flame, Medal } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink, useMatches, useNavigate, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { useExperienceShell } from '@/app/experienceShell'
import { OfflineIndicator } from '@/components/feedback/OfflineIndicator'
import { AnimatedNumber, IconButton } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useLearnerStore } from '@/state/learnerStore'

interface RouteHandle {
  title?: string
}

export function PageHeader({ immersive = false }: { immersive?: boolean }) {
  const { appConfig, courseById, lessonById } = useContent()
  const { navigation, headerStatus } = useExperienceShell()
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
      className="sticky top-0 z-header border-b border-neutral-200/80 bg-neutral-50/90 backdrop-blur-lg"
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
          <img
            alt="Autovrse logo"
            className="size-8 shrink-0 rounded-sm"
            height="32"
            src="/brand/autovrse-logo.svg"
            width="32"
          />
          <div className="min-w-0">
            {!immersive ? (
              <p className="text-caption font-semibold tracking-wide text-brand-700 uppercase">
                {appConfig.app.name}
              </p>
            ) : null}
            <p className="truncate font-bold text-neutral-900">{title}</p>
          </div>
        </div>
        {!immersive ? (
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
            {navigation.map(({ to, label, end }) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-small font-semibold transition-colors',
                    isActive
                      ? 'bg-brand-100 text-brand-800'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  )
                }
                end={end}
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        ) : null}
        {!immersive && headerStatus === 'learner' ? (
          <div
            aria-label="Learner status"
            aria-live="polite"
            className="flex items-center gap-3 text-small font-semibold"
          >
            <OfflineIndicator />
            <span className="flex items-center gap-1 text-xp">
              <Medal aria-hidden="true" size={17} /> <AnimatedNumber value={xp} />
            </span>
            <span className="flex items-center gap-1 text-streak">
              <Flame aria-hidden="true" size={17} /> <AnimatedNumber value={streak} />
            </span>
          </div>
        ) : !immersive ? (
          <OfflineIndicator />
        ) : null}
      </div>
    </header>
  )
}
