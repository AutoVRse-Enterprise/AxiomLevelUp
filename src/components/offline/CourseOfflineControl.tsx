import { useMemo } from 'react'

import { useContent } from '@/app/contentContext'
import { OfflinePackageControl } from '@/components/offline/OfflinePackageControl'
import type { Course } from '@/content/schema'
import { buildCoursePackage } from '@/offline/package'

export function CourseOfflineControl({ course }: { course: Course }) {
  const registry = useContent()
  const coursePackage = useMemo(
    () =>
      buildCoursePackage(
        course,
        registry,
        import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
      ),
    [course, registry],
  )
  return <OfflinePackageControl offlinePackage={coursePackage} title={course.title} />
}
