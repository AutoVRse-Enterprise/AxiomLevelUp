import { ArrowRight, Route } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CaseLabCard } from '@/components/learning/CaseLabCard'
import { CourseCard, SectionHeader } from '@/components/learning'
import { Card, ProgressBar } from '@/components/ui'
import { cn } from '@/lib/cn'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCoursePackage } from '@/offline/package'
import { isCourseOfflineReady } from '@/offline/readiness'
import { useConnectivity } from '@/pwa/connectivity'
import { useLearnerStore } from '@/state/learnerStore'
import { today } from '@/lib/clock'
import {
  selectCaseLabCards,
  selectCourseSummary,
  selectPathwayView,
  type LearningStatus,
} from '@/state/selectors'

type Filter = 'all' | 'offline' | 'in_progress' | 'not_started' | 'completed' | 'new'

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'offline', label: 'Available offline' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'not_started', label: 'Not started' },
  { id: 'completed', label: 'Completed' },
  { id: 'new', label: 'New' },
]

export function LearnPage() {
  const registry = useContent()
  const { online } = useConnectivity()
  const { appConfig, catalogCourses, courseById, lessonById, assetById } = registry
  const [searchParams, setSearchParams] = useSearchParams()
  const learner = useLearnerStore((state) => state.learner)
  const xp = useLearnerStore((state) => state.xp)
  const weeklyGoal = useLearnerStore((state) => state.weeklyGoal)
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const caseProgress = useLearnerStore((state) => state.caseProgress)
  const caseAttempts = useLearnerStore((state) => state.caseAttempts)
  const challenges = useLearnerStore((state) => state.challenges)
  const badges = useLearnerStore((state) => state.badges)
  const mastery = useLearnerStore((state) => state.mastery)
  const stats = useLearnerStore((state) => state.stats)
  const gamification = useLearnerStore((state) => state.gamification)
  const offlineRecords = useOfflineLibraryStore((state) => state.records)
  const requestedFilter = searchParams.get('status')
  const activeFilter = filters.some(({ id }) => id === requestedFilter)
    ? (requestedFilter as Filter)
    : 'all'
  const summaries = catalogCourses.map((course) =>
    selectCourseSummary({ lessonProgress }, course, lessonById, courseById),
  )
  const caseCards = selectCaseLabCards({ caseProgress, caseAttempts }, registry)
  const offlineReadyByCourse = new Map(
    catalogCourses.map((course) => {
      const coursePackage = buildCoursePackage(
        course,
        registry,
        import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
      )
      return [course.id, isCourseOfflineReady(coursePackage, offlineRecords[course.id])]
    }),
  )
  const matchesFilter = (courseId: string, status: LearningStatus) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'offline') return offlineReadyByCourse.get(courseId) === true
    if (activeFilter === 'not_started') return status === 'available' || status === 'locked'
    return status === activeFilter
  }
  const visible = summaries
    .filter(({ course, status }) => matchesFilter(course.id, status))
    .sort((left, right) =>
      online
        ? 0
        : Number(offlineReadyByCourse.get(right.course.id)) -
          Number(offlineReadyByCourse.get(left.course.id)),
    )
  const groups = Object.entries(
    visible.reduce<Record<string, typeof visible>>((result, summary) => {
      result[summary.course.category] ??= []
      result[summary.course.category]?.push(summary)
      return result
    }, {}),
  )
  const activePathway = appConfig.pathways.find(({ active }) => active)
  const pathwayView = activePathway
    ? selectPathwayView(
        {
          learner,
          xp,
          weeklyGoal,
          lessonProgress,
          challenges,
          badges,
          mastery,
          stats,
          gamification,
        },
        activePathway,
        lessonById,
        appConfig.challenges,
        today(),
        appConfig.product.weekStartsOn,
      )
    : null

  return (
    <div className="space-y-9">
      <header>
        <h1 className="text-display font-bold">Build scientific confidence</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Follow your active pathway or choose a focused course.
        </p>
      </header>

      {activePathway && pathwayView ? (
        <Card className="overflow-hidden bg-gradient-to-br from-brand-900 to-brand-700 text-white">
          <Route aria-hidden="true" className="text-brand-200" size={30} />
          <p className="mt-4 text-caption font-bold uppercase tracking-wide text-brand-200">
            Active pathway
          </p>
          <h2 className="mt-2 text-title font-bold">{activePathway.title}</h2>
          <p className="mt-2 max-w-2xl text-brand-100">{activePathway.description}</p>
          <ProgressBar
            className="mt-5 [&_span]:text-white [&_[role=progressbar]]:bg-brand-950/40"
            label="Pathway progress"
            max={pathwayView.nodes.length}
            value={pathwayView.nodes.filter(({ status }) => status === 'completed').length}
          />
          <Link
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-white px-4 font-semibold text-brand-800"
            to={`/learn/pathways/${activePathway.id}`}
          >
            Continue pathway <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </Card>
      ) : null}

      {caseCards.length ? (
        <section aria-label={appConfig.caseLab?.title ?? 'Case Lab'}>
          <SectionHeader
            description={`${caseCards.length} ${caseCards.length === 1 ? 'case' : 'cases'} · all tiers open`}
            title={appConfig.caseLab?.title ?? 'Case Lab'}
          />
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {caseCards.map((caseView) => (
              <CaseLabCard caseView={caseView} key={caseView.caseId} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Course catalog">
        <SectionHeader
          description={`${catalogCourses.length} courses · ${catalogCourses.reduce((total, course) => total + course.lessons.length, 0)} lessons`}
          title="Course catalog"
        />
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Filter courses">
          {filters.map(({ id, label }) => (
            <button
              aria-pressed={activeFilter === id}
              className={cn(
                'min-h-10 shrink-0 rounded-full border px-4 text-small font-semibold transition-colors',
                activeFilter === id
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-400',
              )}
              key={id}
              onClick={() => setSearchParams(id === 'all' ? {} : { status: id })}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {groups.length ? (
          <div className="mt-7 space-y-9">
            {groups.map(([category, items]) => (
              <section aria-labelledby={`category-${category}`} key={category}>
                <h2 className="text-heading font-bold" id={`category-${category}`}>
                  {category}
                </h2>
                <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((summary) => (
                    <CourseCard
                      category={summary.course.category}
                      completion={summary.completion}
                      description={summary.course.description}
                      difficulty={summary.course.difficulty}
                      estimatedMinutes={summary.course.estimatedMinutes}
                      id={summary.course.id}
                      imageUrl={
                        summary.course.imageAssetId
                          ? assetById.get(summary.course.imageAssetId)?.path
                          : undefined
                      }
                      key={summary.course.id}
                      lessonCount={summary.totalCount}
                      lockReasons={summary.unmetCoursePrerequisites}
                      offlineReady={offlineReadyByCourse.get(summary.course.id)}
                      status={summary.status}
                      title={summary.course.title}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              action={
                <button
                  className="font-semibold text-brand-700 underline underline-offset-4"
                  onClick={() => setSearchParams({})}
                  type="button"
                >
                  Show all courses
                </button>
              }
              message="Choose another status to see more learning."
              title="No courses match this filter"
              titleAs="h2"
            />
          </div>
        )}
      </section>
    </div>
  )
}
