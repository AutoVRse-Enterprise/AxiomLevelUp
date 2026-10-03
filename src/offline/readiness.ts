import type { OfflineDownloadRecord } from '@/offline/offlineLibraryStore'
import type {
  CaseOfflinePackage,
  ChallengeOfflinePackage,
  CourseOfflinePackage,
  OfflinePackage,
} from '@/offline/package'

export function isOfflinePackageReady(
  offlinePackage: OfflinePackage,
  record?: OfflineDownloadRecord,
) {
  if (offlinePackage.totalBytes === 0) return true
  return (
    record?.packageKind === offlinePackage.kind &&
    record.packageId === offlinePackage.id &&
    record.status === 'available' &&
    record.fingerprint === offlinePackage.fingerprint
  )
}

export function isCourseOfflineReady(
  coursePackage: CourseOfflinePackage,
  record?: OfflineDownloadRecord,
) {
  return isOfflinePackageReady(coursePackage, record)
}

export function isCaseOfflineReady(
  casePackage: CaseOfflinePackage,
  record?: OfflineDownloadRecord,
) {
  return isOfflinePackageReady(casePackage, record)
}

export function isChallengeOfflineReady(challengePackage: ChallengeOfflinePackage) {
  return challengePackage.assets.every(({ delivery }) => delivery === 'shell')
}

export function isLessonOfflineReady(
  coursePackage: CourseOfflinePackage,
  lessonId: string,
  record?: OfflineDownloadRecord,
) {
  const lesson = coursePackage.lessons.find((item) => item.lessonId === lessonId)
  if (!lesson) return false
  const downloadAssets = lesson.requiredAssetIds.filter(
    (assetId) =>
      coursePackage.assets.find((asset) => asset.assetId === assetId)?.delivery === 'download',
  )
  if (downloadAssets.length === 0) return true
  if (!isCourseOfflineReady(coursePackage, record)) return false
  return downloadAssets.every((assetId) => (record?.assetUrls[assetId]?.length ?? 0) > 0)
}
