import type { ContentRegistry } from '@/content/loader'
import { getPrimitiveAssetRefs, type Course, type Primitive } from '@/content/schema'

type Asset = ContentRegistry['assetManifest']['assets'][number]

export interface OfflinePackageAsset {
  assetId: string
  type: Asset['type']
  url: string
  sizeBytes: number
  sha256?: string
  required: boolean
  delivery: 'shell' | 'download'
}

export interface LessonOfflinePackage {
  lessonId: string
  assetIds: readonly string[]
  requiredAssetIds: readonly string[]
}

export interface CourseOfflinePackage {
  kind: 'course'
  id: string
  version: string
  assets: readonly OfflinePackageAsset[]
  lessons: readonly LessonOfflinePackage[]
  fingerprint: string
  totalBytes: number
}

export interface ChallengeOfflinePackage {
  kind: 'challenge'
  id: string
  assets: readonly OfflinePackageAsset[]
  fingerprint: string
  totalBytes: number
}

const shellExtensions = new Set(['.svg', '.png', '.ico'])

function extension(path: string) {
  const match = path.toLowerCase().match(/\.[a-z0-9]+(?:$|[?#])/)
  return match?.[0].replace(/[?#].*$/, '') ?? ''
}

function deliveryFor(asset: Asset): OfflinePackageAsset['delivery'] {
  return asset.type !== 'dicom' && shellExtensions.has(extension(asset.path))
    ? 'shell'
    : 'download'
}

function assetUrl(asset: Asset, dicomBaseUrl: string) {
  if (asset.type !== 'dicom') return asset.path
  const base = dicomBaseUrl.endsWith('/') ? dicomBaseUrl : `${dicomBaseUrl}/`
  if (/^https?:\/\//i.test(base)) return new URL(asset.path.replace(/^\/+/, ''), base).href
  return `${base}${asset.path.replace(/^\/+/, '')}`
}

function primitiveAssetIds(primitive: Primitive) {
  return [
    ...primitive.assets,
    ...getPrimitiveAssetRefs(primitive).map(({ assetId }) => assetId),
  ]
}

function packageAsset(asset: Asset, required: boolean, dicomBaseUrl: string): OfflinePackageAsset {
  return {
    assetId: asset.assetId,
    type: asset.type,
    url: assetUrl(asset, dicomBaseUrl),
    sizeBytes: asset.sizeBytes,
    sha256: asset.sha256,
    required,
    delivery: deliveryFor(asset),
  }
}

function unique(values: readonly string[]) {
  return [...new Set(values)]
}

export function estimateBytes(assets: readonly OfflinePackageAsset[]) {
  return assets
    .filter(({ delivery }) => delivery === 'download')
    .reduce((total, asset) => total + asset.sizeBytes, 0)
}

export function packageFingerprint(
  version: string,
  assets: readonly OfflinePackageAsset[],
): string {
  const parts = [...assets]
    .sort((left, right) => left.assetId.localeCompare(right.assetId))
    .map((asset) => `${asset.assetId}:${asset.sizeBytes}:${asset.sha256 ?? asset.url}`)
  return `${version}|${parts.join('|')}`
}

export function buildCoursePackage(
  course: Course,
  registry: ContentRegistry,
  dicomBaseUrl = '/assets/dicom/',
): CourseOfflinePackage {
  const lessonAssetIds = course.lessons.map((lesson) => ({
    lessonId: lesson.id,
    assetIds: unique(lesson.primitives.flatMap(primitiveAssetIds)),
  }))
  const allIds = unique([
    ...(course.imageAssetId ? [course.imageAssetId] : []),
    ...lessonAssetIds.flatMap(({ assetIds }) => assetIds),
  ])
  const usedInLesson = new Set(lessonAssetIds.flatMap(({ assetIds }) => assetIds))
  const assets = allIds.flatMap((assetId) => {
    const asset = registry.assetById.get(assetId)
    if (!asset || !asset.offlineAvailable) return []
    return [packageAsset(asset, usedInLesson.has(assetId) && asset.offlineRequired, dicomBaseUrl)]
  })
  const lessons = lessonAssetIds.map(({ lessonId, assetIds }) => ({
    lessonId,
    assetIds,
    requiredAssetIds: assetIds.filter(
      (assetId) => registry.assetById.get(assetId)?.offlineRequired,
    ),
  }))

  return {
    kind: 'course',
    id: course.id,
    version: course.courseVersion,
    assets,
    lessons,
    fingerprint: packageFingerprint(course.courseVersion, assets),
    totalBytes: estimateBytes(assets),
  }
}

export function challengePackage(
  challengeId: string,
  registry: ContentRegistry,
  dicomBaseUrl = '/assets/dicom/',
): ChallengeOfflinePackage | undefined {
  const challenge = registry.appConfig.challenges.find(({ id }) => id === challengeId)
  if (!challenge) return undefined
  const ids = unique(challenge.items.flatMap(primitiveAssetIds))
  const assets = ids.flatMap((assetId) => {
    const asset = registry.assetById.get(assetId)
    return asset?.offlineAvailable
      ? [packageAsset(asset, asset.offlineRequired, dicomBaseUrl)]
      : []
  })
  return {
    kind: 'challenge',
    id: challenge.id,
    assets,
    fingerprint: packageFingerprint('challenge', assets),
    totalBytes: estimateBytes(assets),
  }
}

export function lessonRequiredUrls(
  coursePackage: CourseOfflinePackage,
  lessonId: string,
): readonly string[] {
  const requiredIds = new Set(
    coursePackage.lessons.find((lesson) => lesson.lessonId === lessonId)?.requiredAssetIds ?? [],
  )
  return coursePackage.assets
    .filter((asset) => requiredIds.has(asset.assetId) && asset.delivery === 'download')
    .map(({ url }) => url)
}
