import { ArrowRight, BookOpen, Clock, Gauge, Users } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'

import { useContent } from '@/app/contentContext'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LessonRow, SectionHeader, StatusBadge } from '@/components/learning'
import { CourseOfflineControl } from '@/components/offline/CourseOfflineControl'
import { Card, Chip, ProgressBar } from '@/components/ui'
import { useAssetUrl } from '@/content/useAssetUrl'
import { emitEvent } from '@/events/bus'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCoursePackage } from '@/offline/package'
import { isLessonOfflineReady } from '@/offline/readiness'
import { useLearnerStore } from '@/state/learnerStore'
import { selectCourseSummary } from '@/state/selectors'

export function CoursePage() {
  const { courseId } = useParams()
  const registry = useContent()
  const { courseById, lessonById } = registry
  const lessonProgress = useLearnerStore((state) => state.lessonProgress)
  const offlineRecord = useOfflineLibraryStore((state) =>
    courseId ? state.records[courseId] : undefined,
  )
  const course = courseId ? courseById.get(courseId) : undefined
  const imageUrl = useAssetUrl(course?.imageAssetId)

  useEffect(() => {
    if (course) emitEvent({ event: 'course_opened', courseId: course.id })
  }, [course])

  if (!course) {
    return (
      <EmptyState
        action={
          <Link className="font-semibold text-brand-700 underline underline-offset-4" to="/learn">
            Browse courses
          </Link>
        }
        message="This course is unavailable or may have moved."
        title="Course not found"
      />
    )
  }

  const summary = selectCourseSummary({ lessonProgress }, course, lessonById, courseById)
  const offlinePackage = buildCoursePackage(
    course,
    registry,
    import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
  )
  const requirement =
    course.completionRequirement.mode === 'all_lessons'
      ? `Complete all ${course.lessons.length} lessons`
      : `Complete ${course.completionRequirement.minimumLessons ?? course.lessons.length} lessons`
  const primaryLabel =
    summary.status === 'completed'
      ? 'Review course'
      : summary.status === 'in_progress'
        ? 'Continue course'
        : 'Start course'
  const primaryLesson = summary.nextLesson ?? course.lessons[0]

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-card">
        <div className="grid lg:grid-cols-[minmax(18rem,0.8fr)_1.2fr]">
          {imageUrl ? (
            <img alt="" className="h-full min-h-64 w-full object-cover" src={imageUrl} />
          ) : null}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <Chip tone="brand">{course.category}</Chip>
              <StatusBadge status={summary.status} />
            </div>
            <h1 className="mt-4 text-display font-bold">{course.title}</h1>
            <p className="mt-3 text-neutral-600">{course.description}</p>
            <ul
              aria-label="Course details"
              className="mt-5 grid gap-3 text-small text-neutral-700 sm:grid-cols-3"
            >
              <li className="flex items-center gap-2">
                <Clock aria-hidden="true" size={17} />
                <span>{course.estimatedMinutes} min</span>
              </li>
              <li className="flex items-center gap-2 capitalize">
                <Gauge aria-hidden="true" size={17} />
                <span>{course.difficulty}</span>
              </li>
              <li className="flex items-center gap-2">
                <Users aria-hidden="true" size={17} />
                <span>{course.authors.join(', ')}</span>
              </li>
            </ul>
            <p className="mt-4 text-caption text-neutral-600">
              Course version {course.courseVersion}
            </p>
            <ProgressBar className="mt-5" label="Course progress" value={summary.completion} />
            {primaryLesson && summary.status !== 'locked' ? (
              <Link
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800 focus-visible:outline-2"
                to={`/learn/courses/${course.id}/lessons/${primaryLesson.id}`}
              >
                {primaryLabel} <ArrowRight aria-hidden="true" size={17} />
              </Link>
            ) : null}
            <CourseOfflineControl course={course} />
          </div>
        </div>
      </section>

      {summary.unmetCoursePrerequisites.length ? (
        <Card>
          <h2 className="font-bold">Course prerequisites</h2>
          <p className="mt-2 text-neutral-600">
            Complete {summary.unmetCoursePrerequisites.join(' and ')} to unlock this course.
          </p>
        </Card>
      ) : null}

      <section aria-label="Course lessons">
        <SectionHeader
          description={`${summary.completedCount} of ${summary.totalCount} complete · ${summary.remainingMinutes} min remaining · ${requirement}`}
          title="Lessons"
        />
        <div className="mt-5 space-y-4">
          {summary.lessons.map(({ lesson, status, unmetPrerequisites, progress }) => (
            <LessonRow
              bestScore={progress?.bestScore ?? null}
              description={lesson.description}
              difficulty={lesson.difficulty}
              estimatedMinutes={lesson.estimatedMinutes}
              key={lesson.id}
              lockReasons={unmetPrerequisites}
              offlineReady={isLessonOfflineReady(offlinePackage, lesson.id, offlineRecord)}
              stars={progress?.stars ?? 0}
              status={status}
              title={lesson.title}
              to={`/learn/courses/${course.id}/lessons/${lesson.id}`}
            />
          ))}
        </div>
      </section>

      <Card className="flex items-center gap-4">
        <BookOpen aria-hidden="true" className="shrink-0 text-brand-700" size={24} />
        <div>
          <h2 className="font-bold">Completion requirement</h2>
          <p className="mt-1 text-small text-neutral-600">{requirement} to finish this course.</p>
        </div>
      </Card>
    </div>
  )
}
