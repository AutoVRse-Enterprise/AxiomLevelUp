import {
  appConfigSchema,
  assetManifestSchema,
  contentManifestSchema,
  courseSchema,
  getPrimitiveAssetRefs,
  learnerSeedSchema,
  parsePrimitive,
  type AppConfig,
  type AchievementCriterion,
  type AssetManifest,
  type ContentManifest,
  type Course,
  type DicomPrimitive,
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
  catalogCourses: readonly Course[]
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
  const catalogCourses = courses.filter(({ visibility }) => visibility === 'learner')
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
  const courseIds = new Set(courses.map(({ id }) => id))
  const lessonIds = new Set(lessons.map(({ id }) => id))
  const conceptIds = new Set(appConfig.concepts.map(({ id }) => id))
  const challengeIds = new Set(appConfig.challenges.map(({ id }) => id))
  const badgeIds = new Set(appConfig.badges.map(({ id }) => id))
  const assetById = new Map(assetManifest.assets.map((asset) => [asset.assetId, asset]))
  assetManifest.assets.forEach((asset, index) => {
    if (asset.offlineRequired && !asset.offlineAvailable) {
      warnings.push({
        file: input.assetManifestFile,
        path: `assets.${index}.offlineAvailable`,
        message: `Asset "${asset.assetId}" is required offline but cannot be downloaded; lessons using it can never be offline-ready.`,
        severity: 'warning',
      })
    }
  })
  const primitiveRewardIds = new Set(
    courses.flatMap((course) =>
      course.lessons.flatMap((lesson) =>
        lesson.primitives.flatMap((primitive) => (primitive.reward ? [primitive.reward.id] : [])),
      ),
    ),
  )

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

  const validateDicomSemantics = (primitive: DicomPrimitive, file: string, path: string) => {
    const asset = assetById.get(primitive.content.seriesAssetId)
    if (!asset || asset.type !== 'dicom' || !asset.series) return
    const sliceCount = asset.series.sliceCount
    const assertSlice = (slice: number, suffix: string) => {
      if (slice > sliceCount) {
        issues.push({
          file,
          path: `${path}.${suffix}`,
          message: `Slice ${slice} exceeds series slice count ${sliceCount}.`,
          severity: 'error',
        })
      }
    }
    const assertRange = (range: { from: number; to: number }, suffix: string) => {
      assertSlice(range.from, `${suffix}.from`)
      assertSlice(range.to, `${suffix}.to`)
    }

    if (primitive.content.initialSlice) {
      assertSlice(primitive.content.initialSlice, 'content.initialSlice')
    }
    if (primitive.type === 'dicom_explore' && primitive.content.requirements?.visitSliceRange) {
      assertRange(
        primitive.content.requirements.visitSliceRange,
        'content.requirements.visitSliceRange',
      )
    }
    if (primitive.type === 'dicom_guided') {
      primitive.content.steps.forEach((step, index) => {
        if (step.condition.type === 'slice_range') {
          assertRange(step.condition.range, `content.steps.${index}.condition.range`)
        }
      })
    }
    if (primitive.type === 'dicom_identify_region') {
      assertRange(primitive.content.target.sliceRange, 'content.target.sliceRange')
      assertSlice(primitive.content.target.referenceSlice, 'content.target.referenceSlice')
    }
    if (primitive.type === 'dicom_measure') {
      assertRange(primitive.content.target.sliceRange, 'content.target.sliceRange')
      if (!asset.series.calibrated) {
        issues.push({
          file,
          path: `${path}.content.seriesAssetId`,
          message: 'Graded DICOM measurement requires a calibrated series asset.',
          severity: 'error',
        })
      }
      const line = primitive.content.target.referenceLine
      if (line) {
        assertSlice(line.slice, 'content.target.referenceLine.slice')
        const horizontal =
          (line.end.x - line.start.x) * asset.series.columns * asset.series.pixelSpacingMm[1]
        const vertical =
          (line.end.y - line.start.y) * asset.series.rows * asset.series.pixelSpacingMm[0]
        const actual = Math.hypot(horizontal, vertical)
        const expected = primitive.content.target.expected
        const allowed =
          expected.tolerance.mode === 'percent'
            ? expected.valueMm * (expected.tolerance.value / 100)
            : expected.tolerance.value
        if (Math.abs(actual - expected.valueMm) > allowed) {
          issues.push({
            file,
            path: `${path}.content.target.referenceLine`,
            message: `Reference line measures ${actual.toFixed(2)} mm, outside the authored ${expected.valueMm.toFixed(2)} ± ${allowed.toFixed(2)} mm.`,
            severity: 'error',
          })
        }
      }
    }
  }

  const validateCriterion = (criterion: AchievementCriterion, file: string, path: string) => {
    if ('lessonIds' in criterion) {
      criterion.lessonIds?.forEach((id, index) =>
        requireRef(lessonIds, id, file, `${path}.lessonIds.${index}`, 'lesson'),
      )
    }
    if ('courseIds' in criterion) {
      criterion.courseIds?.forEach((id, index) =>
        requireRef(courseIds, id, file, `${path}.courseIds.${index}`, 'course'),
      )
    }
    if ('challengeIds' in criterion) {
      criterion.challengeIds?.forEach((id, index) =>
        requireRef(challengeIds, id, file, `${path}.challengeIds.${index}`, 'challenge'),
      )
    }
    if ('conceptIds' in criterion) {
      criterion.conceptIds?.forEach((id, index) =>
        requireRef(conceptIds, id, file, `${path}.conceptIds.${index}`, 'concept'),
      )
    }
    if ('primitiveTypes' in criterion) {
      criterion.primitiveTypes?.forEach((id, index) =>
        requireRef(primitiveTypeSet, id, file, `${path}.primitiveTypes.${index}`, 'primitive type'),
      )
    }
    if (
      criterion.type === 'first_attempt_correct' &&
      criterion.primitiveTypes &&
      criterion.conceptIds
    ) {
      issues.push({
        file,
        path,
        message: 'First-attempt criteria must filter by primitive types or concept IDs, not both.',
        severity: 'error',
      })
    }
    if (criterion.type === 'primitive_reward') {
      requireRef(badgeIds, criterion.rewardId, file, `${path}.rewardId`, 'badge')
      requireRef(
        primitiveRewardIds,
        criterion.rewardId,
        file,
        `${path}.rewardId`,
        'primitive reward',
      )
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
      if (result.primitive.type.startsWith('dicom_')) {
        validateDicomSemantics(result.primitive as DicomPrimitive, file, path)
      }
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
    validateCriterion(badge.criteria, input.appConfigFile, `badges.${index}.criteria`)
  })

  const orderedLevels = [...appConfig.gamification.levels].sort(
    (left, right) => left.minimumXp - right.minimumXp,
  )
  if (
    orderedLevels[0]?.minimumXp !== 0 ||
    new Set(orderedLevels.map(({ level }) => level)).size !== orderedLevels.length ||
    orderedLevels.some(
      (level, index) => index > 0 && level.minimumXp <= (orderedLevels[index - 1]?.minimumXp ?? -1),
    )
  ) {
    issues.push({
      file: input.appConfigFile,
      path: 'gamification.levels',
      message: 'Levels require unique identifiers and strictly increasing XP thresholds from zero.',
      severity: 'error',
    })
  }
  const stars = appConfig.gamification.stars
  if (!(stars.one <= stars.two && stars.two <= stars.three)) {
    issues.push({
      file: input.appConfigFile,
      path: 'gamification.stars',
      message: 'Star thresholds must be ordered from one through three stars.',
      severity: 'error',
    })
  }

  appConfig.challenges.forEach((challenge, index) => {
    if (challenge.progressRule) {
      validateCriterion(
        challenge.progressRule,
        input.appConfigFile,
        `challenges.${index}.progressRule`,
      )
    }
    if (challenge.type === 'weekly' && !challenge.progressRule) {
      issues.push({
        file: input.appConfigFile,
        path: `challenges.${index}.progressRule`,
        message: `Weekly challenge "${challenge.id}" requires a progress rule.`,
        severity: 'error',
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
    catalogCourses: Object.freeze(catalogCourses),
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
