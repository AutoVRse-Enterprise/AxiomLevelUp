import { useEffect } from 'react'

import { useContent } from '@/app/contentContext'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import { buildCoursePackage } from '@/offline/package'
import { getDownloadManager } from '@/offline/runtime'

export function OfflineReconciler() {
  const registry = useContent()
  const hydrated = useOfflineLibraryStore((state) => state.hydrated)

  useEffect(() => {
    if (!hydrated) return
    const packages = new Map(
      registry.courses.map((course) => [
        course.id,
        buildCoursePackage(
          course,
          registry,
          import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
        ),
      ]),
    )
    void getDownloadManager(registry.appConfig.product.offline).reconcile(packages)
  }, [hydrated, registry])

  return null
}
