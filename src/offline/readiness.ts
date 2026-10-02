import type { OfflineDownloadRecord } from '@/offline/offlineLibraryStore'
import type { ChallengeOfflinePackage, CourseOfflinePackage } from '@/offline/package'

export function isCourseOfflineReady(
  coursePackage: CourseOfflinePackage,
  record?: OfflineDownloadRecord,
) {
  if (coursePackage.totalBytes === 0) return true
  return record?.status === 'available' && record.fingerprint === coursePackage.fingerprint
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
