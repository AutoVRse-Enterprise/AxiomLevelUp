import { LockKeyhole, Puzzle, WifiOff } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { buildActivityPlan, lessonActivity } from '@/engines/learning/plan'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCoursePackage } from '@/offline/package'
import { isLessonOfflineReady } from '@/offline/readiness'
import { ActivityPlayer } from '@/player/ActivityPlayer'
import { useConnectivity } from '@/pwa/connectivity'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCourseSummary, selectLessonAvailability } from '@/state/selectors'

const backLink = (courseId: string) => (
  <Link className="font-semibold text-brand-700 underline" to={`/learn/courses/${courseId}`}>
    Return to course
  </Link>
)

export function LessonPlayerPage() {
  const { courseId, lessonId } = useParams()
  const registry = useContent()
  const { online } = useConnectivity()
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const offlineRecord = useOfflineLibraryStore((state) =>
    courseId ? state.records[courseId] : undefined,
  )
  const course = courseId ? registry.courseById.get(courseId) : undefined
  const lesson = course?.lessons.find(({ id }) => id === lessonId)
  const plan = useMemo(
    () =>
      course && lesson
        ? buildActivityPlan(lessonActivity(course.id, course.courseVersion, lesson), {
            environment: import.meta.env.DEV ? 'development' : 'production',
            player: registry.appConfig.product.player,
          })
        : null,
    [course, lesson, registry.appConfig.product.player],
  )

  if (!course || !lesson || !plan) {
    return (
      <EmptyState
        title="Lesson not found"
        message="This lesson is unavailable or may have moved."
        action={<Link to="/learn">Return to Learn</Link>}
      />
    )
  }

  const courseSummary = selectCourseSummary(
    { lessonProgress },
    course,
    registry.lessonById,
    registry.courseById,
  )
  const availability = selectLessonAvailability({ lessonProgress }, lesson, registry.lessonById)
  const lockReasons = [
    ...courseSummary.unmetCoursePrerequisites,
    ...availability.unmetPrerequisites,
  ]
  if (courseSummary.status === 'locked' || availability.status === 'locked') {
    return (
      <EmptyState
        icon={<LockKeyhole aria-hidden="true" size={30} />}
        title="Lesson locked"
        message={`Complete ${lockReasons.join(' and ')} before starting this lesson.`}
        action={backLink(course.id)}
      />
    )
  }
  if (!plan.playable) {
    return (
      <EmptyState
        icon={<Puzzle aria-hidden="true" size={30} />}
        title="Lesson unavailable"
        message={plan.unavailableReason ?? 'This lesson is currently unavailable.'}
        action={backLink(course.id)}
      />
    )
  }

  const offlinePackage = buildCoursePackage(
    course,
    registry,
    import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
  )
  if (!online && !isLessonOfflineReady(offlinePackage, lesson.id, offlineRecord)) {
    return (
      <EmptyState
        icon={<WifiOff aria-hidden="true" size={30} />}
        title="This lesson has not been downloaded"
        message="Connect to the internet or choose an offline lesson."
        action={
          <span className="flex flex-wrap justify-center gap-4">
            {backLink(course.id)}
            <Link className="font-semibold text-brand-700 underline" to="/learn">
              Choose an offline lesson
            </Link>
          </span>
        }
      />
    )
  }

  const progress = lessonProgress[lesson.id]
  const lessonIndex = course.lessons.findIndex(({ id }) => id === lesson.id)
  const nextLesson = course.lessons[lessonIndex + 1]
  return (
    <ActivityPlayer
      plan={plan}
      previousAttempts={progress?.attempts ?? 0}
      previousBestScore={progress?.bestScore ?? null}
      continuePath={
        nextLesson
          ? `/learn/courses/${course.id}/lessons/${nextLesson.id}`
          : `/learn/courses/${course.id}`
      }
      exitPath={`/learn/courses/${course.id}`}
    />
  )
}
