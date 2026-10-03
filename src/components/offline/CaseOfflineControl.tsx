import { useMemo } from 'react'

import { useContent } from '@/app/contentContext'
import { OfflinePackageControl } from '@/components/offline/OfflinePackageControl'
import type { AnatomyMap, CaseDocument } from '@/content/schema'
import { buildCasePackage } from '@/offline/package'

export function CaseOfflineControl({
  anatomyMap,
  caseDocument,
}: {
  anatomyMap: AnatomyMap
  caseDocument: CaseDocument
}) {
  const registry = useContent()
  const offlinePackage = useMemo(
    () =>
      buildCasePackage(
        caseDocument,
        anatomyMap,
        registry,
        import.meta.env.VITE_DICOM_BASE_URL?.trim() || '/assets/dicom/',
      ),
    [anatomyMap, caseDocument, registry],
  )

  return <OfflinePackageControl offlinePackage={offlinePackage} title={caseDocument.title} />
}
