import {
  appConfigSchema,
  assetManifestSchema,
  contentManifestSchema,
  courseSchema,
  getPrimitiveAssetRefs,
  learnerSeedSchema,
  parsePrimitive,
  type AppConfig,
  type AssetManifest,
  type ContentManifest,
  type Course,
  type LearnerSeed,
  type Lesson,
  type Primitive,
  type PrimitiveAssetType,
} from './schema'
import { badgeIconIdSet } from './badgeIcons'
import { primitiveTypeSet, timerCompatibleTypeSet } from './primitiveTypes'

export interface ContentIssue {
  file: string
  path: string
  message: string
  severity: 'error' | 'warning'
}

export interface ContentBundleInput {
  manifestFile: string
  manifest: unknown
  appConfigFile: string
  appConfig: unknown
  courseFiles: Array<{ file: string; data: unknown }>
  seedFile: string
  seed: unknown
  assetManifestFile: string
  assetManifest: unknown
}

export interface ContentRegistry {
  manifest: ContentManifest
  appConfig: AppConfig
  courses: readonly Course[]
  seed: LearnerSeed
  assetManifest: AssetManifest
  courseById: ReadonlyMap<string, Course>
  lessonById: ReadonlyMap<string, Lesson>
  assetById: ReadonlyMap<string, AssetManifest['assets'][number]>
  warnings: readonly ContentIssue[]
}

export class ContentValidationError extends Error {
  constructor(readonly issues: ContentIssue[]) {
    super(`Content validation failed with ${issues.length} issue${issues.length === 1 ? '' : 's'}.`)
    this.name = 'ContentValidationError'
  }
}

function zodIssues(
  file: string,
  issues: Array<{ path: PropertyKey[]; message: string }>,
): ContentIssue[] {
  return issues.map((issue) => ({
    file,
    path: issue.path.length ? issue.path.map(String).join('.') : '$',
    message: issue.message,
    severity: 'error' as const,
  }))
}

export function validateContentBundle(input: ContentBundleInput): ContentRegistry {
  const issues: ContentIssue[] = []
  const manifestResult = contentManifestSchema.safeParse(input.manifest)
  const appConfigResult = appConfigSchema.safeParse(input.appConfig)
  const seedResult = learnerSeedSchema.safeParse(input.seed)
  const assetManifestResult = assetManifestSchema.safeParse(input.assetManifest)
  const courseResults = input.courseFiles.map(({ file, data }) => ({
    file,
    result: courseSchema.safeParse(data),
  }))

  if (!manifestResult.success)
    issues.push(...zodIssues(input.manifestFile, manifestResult.error.issues))
  if (!appConfigResult.success)
    issues.push(...zodIssues(input.appConfigFile, appConfigResult.error.issues))
  if (!seedResult.success) issues.push(...zodIssues(input.seedFile, seedResult.error.issues))
  if (!assetManifestResult.success)
    issues.push(...zodIssues(input.assetManifestFile, assetManifestResult.error.issues))
  for (const course of courseResults) {
    if (!course.result.success) issues.push(...zodIssues(course.file, course.result.error.issues))
  }

  if (
    !manifestResult.success ||
    !appConfigResult.success ||
    !seedResult.success ||
    !assetManifestResult.success ||
    courseResults.some(({ result }) => !result.success)
  ) {
    throw new ContentValidationError(issues)
  }

  const manifest = manifestResult.data
  const appConfig = appConfigResult.data
  const seed = seedResult.data
  const assetManifest = assetManifestResult.data
  const courses = courseResults.map(({ result }) => {
    if (!result.success) throw new Error('Unreachable invalid course result')
    return result.data
  })
  const warnings: ContentIssue[] = []

  const duplicate = (kind: string, ids: string[], file: string) => {
    const seen = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) {
        issues.push({
          file,
          path: kind,
          message: `Duplicate ${kind} id "${id}".`,
          severity: 'error',
        })
      }
      seen.add(id)
    }
  }

  duplicate(
    'course',
    courses.map(({ id }) => id),
    input.manifestFile,
  )
  duplicate(
    'concept',
    appConfig.concepts.map(({ id }) => id),
    input.appConfigFile,
  )
  duplicate(
    'badge',
    appConfig.badges.map(({ id }) => id),
    input.appConfigFile,
  )
  duplicate(
    'challenge',
    appConfig.challenges.map(({ id }) => id),
    input.appConfigFile,
  )
  duplicate(
    'asset',
    assetManifest.assets.map(({ assetId }) => assetId),
    input.assetManifestFile,
  )

  const courseById = new Map(courses.map((course) => [course.id, course]))
  const lessons = courses.flatMap((course) => course.lessons)
  duplicate(
    'lesson',
    lessons.map(({ id }) => id),
    input.manifestFile,
  )
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]))
  const conceptIds = new Set(appConfig.concepts.map(({ id }) => id))
  const challengeIds = new Set(appConfig.challenges.map(({ id }) => id))
  const badgeIds = new Set(appConfig.badges.map(({ id }) => id))
  const assetById = new Map(assetManifest.assets.map((asset) => [asset.assetId, asset]))

  const requireRef = (
    set: ReadonlySet<string>,
    id: string,
    file: string,
    path: string,
    kind: string,
  ) => {
    if (!set.has(id)) {
      issues.push({
        file,
        path,
        message: `Unknown ${kind} reference "${id}".`,
        severity: 'error',
      })
    }
  }

  const requireAsset = (
    id: string,
    file: string,
    path: string,
    expectedType?: PrimitiveAssetType,
  ) => {
    const asset = assetById.get(id)
    if (!asset) {
      issues.push({
        file,
        path,
        message: `Unknown asset reference "${id}".`,
        severity: 'error',
      })
      return
    }
    if (expectedType && asset.type !== expectedType) {
      issues.push({
        file,
        path,
        message: `Asset reference "${id}" expects type "${expectedType}" but the manifest declares "${asset.type}".`,
        severity: 'error',
      })
    }
  }

  const validatePrimitive = (primitive: Primitive, file: string, path: string) => {
    const result = parsePrimitive(primitive)
    result.issues.forEach((issue) => {
      issues.push(
        ...zodIssues(file, [
          {
            path: [...path.split('.'), ...issue.path],
            message: issue.message,
          },
        ]),
      )
    })
    result.warnings.forEach((message) =>
      warnings.push({
        file,
        path: `${path}.type`,
        message,
        severity: 'warning',
      }),
    )

    primitive.conceptIds.forEach((id, conceptIndex) =>
      requireRef(conceptIds, id, file, `${path}.conceptIds.${conceptIndex}`, 'concept'),
    )
    primitive.assets.forEach((id, assetIndex) =>
      requireAsset(id, file, `${path}.assets.${assetIndex}`),
    )
    if (primitive.reward?.type === 'badge') {
      requireRef(badgeIds, primitive.reward.id, file, `${path}.reward.id`, 'badge')
    }
    if (
      primitive.timer &&
      primitiveTypeSet.has(primitive.type) &&
      !timerCompatibleTypeSet.has(primitive.type)
    ) {
      issues.push({
        file,
        path: `${path}.timer`,
        message: `Primitive type "${primitive.type}" does not support timers.`,
        severity: 'error',
      })
    }

    if (result.primitive) {
      getPrimitiveAssetRefs(result.primitive).forEach((reference) =>
        requireAsset(reference.assetId, file, `${path}.${reference.path}`, reference.type),
      )
    }
  }

  const requireUniquePrimitiveIds = (
    primitives: readonly Primitive[],
    file: string,
    path: string,
  ) => {
    const seen = new Set<string>()
    primitives.forEach((primitive, primitiveIndex) => {
      if (seen.has(primitive.id)) {
        issues.push({
          file,
          path: `${path}.${primitiveIndex}.id`,
          message: `Duplicate primitive id "${primitive.id}" within this activity.`,
          severity: 'error',
        })
      }
      seen.add(primitive.id)
    })
  }

  courses.forEach((course, courseIndex) => {
    const file = input.courseFiles[courseIndex]?.file ?? `course:${course.id}`
    if (course.imageAssetId) {
      requireAsset(course.imageAssetId, file, 'imageAssetId', 'image')
    }
    course.conceptIds.forEach((id, conceptIndex) =>
      requireRef(conceptIds, id, file, `conceptIds.${conceptIndex}`, 'concept'),
    )
    course.prerequisites.forEach((id, prerequisiteIndex) =>
      requireRef(
        new Set(courseById.keys()),
        id,
        file,
        `prerequisites.${prerequisiteIndex}`,
        'course',
      ),
    )
    course.lessons.forEach((lesson, lessonIndex) => {
      lesson.conceptIds.forEach((id, conceptIndex) =>
        requireRef(
          conceptIds,
          id,
          file,
          `lessons.${lessonIndex}.conceptIds.${conceptIndex}`,
          'concept',
        ),
      )
      lesson.prerequisites.forEach((id, prerequisiteIndex) =>
        requireRef(
          new Set(lessonById.keys()),
          id,
          file,
          `lessons.${lessonIndex}.prerequisites.${prerequisiteIndex}`,
          'lesson',
        ),
      )
      requireUniquePrimitiveIds(lesson.primitives, file, `lessons.${lessonIndex}.primitives`)
      lesson.primitives.forEach((primitive, primitiveIndex) => {
        validatePrimitive(primitive, file, `lessons.${lessonIndex}.primitives.${primitiveIndex}`)
      })
    })
  })

  appConfig.challenges.forEach((challenge, challengeIndex) => {
    const itemPath = `challenges.${challengeIndex}.items`
    requireUniquePrimitiveIds(challenge.items, input.appConfigFile, itemPath)
    challenge.items.forEach((primitive, primitiveIndex) => {
      validatePrimitive(primitive, input.appConfigFile, `${itemPath}.${primitiveIndex}`)
    })
  })

  const lessonIds = new Set(lessonById.keys())
  for (const pathway of appConfig.pathways) {
    const nodeIds = new Set(pathway.nodes.map(({ id }) => id))
    pathway.nodes.forEach((node, index) => {
      const refs = node.type === 'challenge' ? challengeIds : lessonIds
      requireRef(
        refs,
        node.refId,
        input.appConfigFile,
        `pathways.${pathway.id}.nodes.${index}`,
        node.type,
      )
    })
    pathway.edges.forEach((edge, index) => {
      requireRef(
        nodeIds,
        edge.from,
        input.appConfigFile,
        `pathways.${pathway.id}.edges.${index}.from`,
        'node',
      )
      requireRef(
        nodeIds,
        edge.to,
        input.appConfigFile,
        `pathways.${pathway.id}.edges.${index}.to`,
        'node',
      )
    })

    const incoming = new Map(pathway.nodes.map(({ id }) => [id, 0]))
    const outgoing = new Map(pathway.nodes.map(({ id }) => [id, [] as string[]]))
    pathway.edges.forEach(({ from, to }) => {
      if (!nodeIds.has(from) || !nodeIds.has(to)) return
      incoming.set(to, (incoming.get(to) ?? 0) + 1)
      outgoing.get(from)?.push(to)
    })
    const roots = [...incoming].filter(([, count]) => count === 0).map(([id]) => id)
    if (roots.length === 0) {
      issues.push({
        file: input.appConfigFile,
        path: `pathways.${pathway.id}.edges`,
        message: `Pathway "${pathway.id}" must have at least one root node.`,
        severity: 'error',
      })
    }
    const visited = new Set<string>()
    const active = new Set<string>()
    let cyclic = false
    const visit = (id: string) => {
      if (active.has(id)) {
        cyclic = true
        return
      }
      if (visited.has(id)) return
      active.add(id)
      outgoing.get(id)?.forEach(visit)
      active.delete(id)
      visited.add(id)
    }
    roots.forEach(visit)
    const reachable = new Set(visited)
    pathway.nodes.forEach(({ id }) => visit(id))
    if (cyclic) {
      issues.push({
        file: input.appConfigFile,
        path: `pathways.${pathway.id}.edges`,
        message: `Pathway "${pathway.id}" must be acyclic.`,
        severity: 'error',
      })
    }
    pathway.nodes.forEach(({ id }, index) => {
      if (!reachable.has(id)) {
        issues.push({
          file: input.appConfigFile,
          path: `pathways.${pathway.id}.nodes.${index}`,
          message: `Pathway node "${id}" is not reachable from a root node.`,
          severity: 'error',
        })
      }
    })
  }

  appConfig.badges.forEach((badge, index) => {
    if (!badgeIconIdSet.has(badge.icon)) {
      warnings.push({
        file: input.appConfigFile,
        path: `badges.${index}.icon`,
        message: `Unknown badge icon "${badge.icon}" will use the fallback icon.`,
        severity: 'warning',
      })
    }
  })

  Object.keys(seed.lessonProgress).forEach((id) =>
    requireRef(lessonIds, id, input.seedFile, 'lessonProgress', 'lesson'),
  )
  Object.keys(seed.mastery).forEach((id) =>
    requireRef(conceptIds, id, input.seedFile, 'mastery', 'concept'),
  )
  Object.keys(seed.badges).forEach((id) =>
    requireRef(badgeIds, id, input.seedFile, 'badges', 'badge'),
  )
  Object.keys(seed.challenges).forEach((id) =>
    requireRef(challengeIds, id, input.seedFile, 'challenges', 'challenge'),
  )

  if (issues.length) throw new ContentValidationError(issues)

  return {
    manifest,
    appConfig,
    courses: Object.freeze(courses),
    seed,
    assetManifest,
    courseById,
    lessonById,
    assetById,
    warnings: Object.freeze(warnings),
  }
}

async function fetchJson(path: string) {
  const response = await fetch(path)
  if (!response.ok)
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  return response.json() as Promise<unknown>
}

function resolveContentPath(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export async function loadContent(baseUrl = '/content'): Promise<ContentRegistry> {
  const manifestFile = resolveContentPath(baseUrl, 'manifest.json')
  const manifest = await fetchJson(manifestFile)
  const parsedManifest = contentManifestSchema.parse(manifest)
  const appConfigFile = resolveContentPath(baseUrl, parsedManifest.appConfig)
  const seedPath = parsedManifest.seeds[parsedManifest.defaultSeed]
  const seedFile = resolveContentPath(baseUrl, seedPath)
  const assetManifestFile = resolveContentPath(baseUrl, parsedManifest.assetManifest)
  const courseFiles = parsedManifest.courses.map((path) => resolveContentPath(baseUrl, path))
  const [appConfig, seed, assetManifest, ...courses] = await Promise.all([
    fetchJson(appConfigFile),
    fetchJson(seedFile),
    fetchJson(assetManifestFile),
    ...courseFiles.map(fetchJson),
  ])

  return validateContentBundle({
    manifestFile,
    manifest,
    appConfigFile,
    appConfig,
    courseFiles: courseFiles.map((file, index) => ({ file, data: courses[index] })),
    seedFile,
    seed,
    assetManifestFile,
    assetManifest,
  })
}
