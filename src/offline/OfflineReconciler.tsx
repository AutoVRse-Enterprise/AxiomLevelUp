import { useEffect } from 'react'

import { useContent } from '@/app/contentContext'
import { useOfflineLibraryStore } from '@/offline/offlineLibraryStore'
import {
  buildCasePackage,
  buildCoursePackage,
  offlinePackageKey,
  type OfflinePackage,
} from '@/offline/package'
import { getDownloadManager } from '@/offline/runtime'

export function OfflineReconciler() {
  const registry = useContent()
  const hydrated = useOfflineLibraryStore((state) => state.hydrated)

  useEffect(() => {
    if (!hydrated) return
    const dicomBaseUrl = import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/'
    const packages = new Map<string, OfflinePackage>()
    registry.courses.forEach((course) => {
      const offlinePackage = buildCoursePackage(course, registry, dicomBaseUrl)
      packages.set(offlinePackageKey(offlinePackage.kind, offlinePackage.id), offlinePackage)
    })
    registry.cases.forEach((caseDocument) => {
      const anatomyMap = registry.anatomyMapById.get(caseDocument.anatomyMapId)
      if (!anatomyMap) return
      const offlinePackage = buildCasePackage(caseDocument, anatomyMap, registry, dicomBaseUrl)
      packages.set(offlinePackageKey(offlinePackage.kind, offlinePackage.id), offlinePackage)
    })
    void getDownloadManager(registry.appConfig.product.offline).reconcile(packages)
  }, [hydrated, registry])

  return null
}
