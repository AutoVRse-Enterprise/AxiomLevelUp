import {
  anatomyMapSchema,
  appConfigSchema,
  assetManifestSchema,
  caseDocumentSchema,
  contentManifestSchema,
  courseSchema,
  getPrimitiveAssetRefs,
  learnerSeedSchema,
  parsePrimitive,
  type AppConfig,
  type AchievementCriterion,
  type AnatomyExplorePrimitive,
  type AnatomyLocatePrimitive,
  type AnatomyMap,
  type AssetManifest,
  type CaseDocument,
  type CaseDifferentialPrimitive,
  type CaseEvidenceSelectPrimitive,
  type ContentManifest,
  type Course,
  type DicomPrimitive,
  type LearnerSeed,
  type Lesson,
  type Primitive,
} from './schema'
import { badgeIconIdSet } from './badgeIcons'
import { validateAnatomyVolumes } from './anatomyVolumeValidation'
import { ContentValidationError, type ContentIssue } from './errors'
import {
  assessmentPrimitiveTypeSet,
  contentPrimitiveTypeSet,
  primitiveTypeSet,
  timerCompatibleTypeSet,
} from './primitiveTypes'
import { calculateCaseScore } from '../engines/cases/scoring'
import { evaluatePrimitive, resolvePrimitiveDefinition } from '../primitives/definitions'

export { ContentValidationError, type ContentIssue } from './errors'

export interface ContentBundleInput {
  manifestFile: string
  manifest: unknown
  appConfigFile: string
  appConfig: unknown
  courseFiles: Array<{ file: string; data: unknown }>
  caseFiles: Array<{ file: string; data: unknown }>
  anatomyMapFiles: Array<{ file: string; data: unknown }>
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
  cases: readonly CaseDocument[]
  anatomyMaps: readonly AnatomyMap[]
  seed: LearnerSeed
  assetManifest: AssetManifest
  courseById: ReadonlyMap<string, Course>
  lessonById: ReadonlyMap<string, Lesson>
  caseById: ReadonlyMap<string, CaseDocument>
  anatomyMapById: ReadonlyMap<string, AnatomyMap>
  assetById: ReadonlyMap<string, AssetManifest['assets'][number]>
  warnings: readonly ContentIssue[]
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

interface ClueIdReference {
  id: string
  path: string
}

function collectClueIdReferences(value: unknown, path = ''): ClueIdReference[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectClueIdReferences(entry, path ? `${path}.${index}` : String(index)),
    )
  }
  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, entry]) => {
    const entryPath = path ? `${path}.${key}` : key
    if (key === 'clueIds' && Array.isArray(entry)) {
      return entry.flatMap((id, index) =>
        typeof id === 'string' ? [{ id, path: `${entryPath}.${index}` }] : [],
      )
    }
    if (key === 'responseClueIds' && entry && typeof entry === 'object') {
      return Object.entries(entry).flatMap(([response, ids]) =>
        Array.isArray(ids)
          ? ids.flatMap((id, index) =>
              typeof id === 'string' ? [{ id, path: `${entryPath}.${response}.${index}` }] : [],
            )
          : [],
      )
    }
    return collectClueIdReferences(entry, entryPath)
  })
}

function collectFindingIdReferences(value: unknown, path = ''): ClueIdReference[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectFindingIdReferences(entry, path ? `${path}.${index}` : String(index)),
    )
  }
  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, entry]) => {
    const entryPath = path ? `${path}.${key}` : key
    if ((key === 'findingIds' || key === 'requiredFindingIds') && Array.isArray(entry)) {
      return entry.flatMap((id, index) =>
        typeof id === 'string' ? [{ id, path: `${entryPath}.${index}` }] : [],
      )
    }
    return collectFindingIdReferences(entry, entryPath)
  })
}

function collectNumericTokens(value: unknown): Set<string> {
  const tokens = new Set<string>()
  const visit = (entry: unknown) => {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      tokens.add(String(entry))
      return
    }
    if (typeof entry === 'string') {
      entry.match(/\b\d+(?:\.\d+)?\b/g)?.forEach((token) => tokens.add(token))
      return
    }
    if (Array.isArray(entry)) {
      entry.forEach(visit)
      return
    }
    if (entry && typeof entry === 'object') Object.values(entry).forEach(visit)
  }
  visit(value)
  return tokens
}

function collectAssessmentPromptText(value: unknown): string[] {
  const text: string[] = []
  const promptKeys = new Set(['prompt', 'question', 'statement', 'label'])
  const visit = (entry: unknown, key?: string) => {
    if (typeof entry === 'string') {
      if (key && promptKeys.has(key)) text.push(entry)
      return
    }
    if (Array.isArray(entry)) {
      entry.forEach((item) => visit(item))
      return
    }
    if (!entry || typeof entry !== 'object') return
    Object.entries(entry).forEach(([entryKey, child]) => visit(child, entryKey))
  }
  visit(value)
  return text
}

export function validateContentBundle(input: ContentBundleInput): ContentRegistry {
  const issues: ContentIssue[] = []
  const rejectClueReferencesOutsideCases = (value: unknown, file: string, path = '') => {
    collectClueIdReferences(value, path).forEach((reference) => {
      issues.push({
        file,
        path: reference.path,
        message: 'clueIds may only be used in case content.',
        severity: 'error',
      })
    })
  }
  const rejectFindingReferencesOutsideCases = (value: unknown, file: string, path = '') => {
    collectFindingIdReferences(value, path).forEach((reference) => {
      issues.push({
        file,
        path: reference.path,
        message: 'findingIds may only be used in case content.',
        severity: 'error',
      })
    })
  }

  rejectClueReferencesOutsideCases(input.manifest, input.manifestFile)
  rejectClueReferencesOutsideCases(input.appConfig, input.appConfigFile)
  rejectClueReferencesOutsideCases(input.seed, input.seedFile)
  rejectClueReferencesOutsideCases(input.assetManifest, input.assetManifestFile)
  input.courseFiles.forEach(({ data, file }) => {
    rejectClueReferencesOutsideCases(data, file)
    rejectFindingReferencesOutsideCases(data, file)
  })

  const manifestResult = contentManifestSchema.safeParse(input.manifest)
  const appConfigResult = appConfigSchema.safeParse(input.appConfig)
  const seedResult = learnerSeedSchema.safeParse(input.seed)
  const assetManifestResult = assetManifestSchema.safeParse(input.assetManifest)
  const courseResults = input.courseFiles.map(({ file, data }) => ({
    file,
    result: courseSchema.safeParse(data),
  }))
  const caseResults = input.caseFiles.map(({ file, data }) => ({
    file,
    result: caseDocumentSchema.safeParse(data),
  }))
  const anatomyMapResults = input.anatomyMapFiles.map(({ file, data }) => ({
    file,
    result: anatomyMapSchema.safeParse(data),
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
  for (const caseDocument of caseResults) {
    if (!caseDocument.result.success) {
      issues.push(...zodIssues(caseDocument.file, caseDocument.result.error.issues))
    }
  }
  for (const anatomyMap of anatomyMapResults) {
    if (!anatomyMap.result.success) {
      issues.push(...zodIssues(anatomyMap.file, anatomyMap.result.error.issues))
    }
  }

  if (
    !manifestResult.success ||
    !appConfigResult.success ||
    !seedResult.success ||
    !assetManifestResult.success ||
    courseResults.some(({ result }) => !result.success) ||
    caseResults.some(({ result }) => !result.success) ||
    anatomyMapResults.some(({ result }) => !result.success)
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
  const cases = caseResults.map(({ result }) => {
    if (!result.success) throw new Error('Unreachable invalid case result')
    return result.data
  })
  const anatomyMaps = anatomyMapResults.map(({ result }) => {
    if (!result.success) throw new Error('Unreachable invalid anatomy map result')
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
  duplicate(
    'case',
    cases.map(({ id }) => id),
    input.manifestFile,
  )
  duplicate(
    'anatomy map',
    anatomyMaps.map(({ id }) => id),
    input.manifestFile,
  )

  const courseById = new Map(courses.map((course) => [course.id, course]))
  const caseById = new Map(cases.map((caseDocument) => [caseDocument.id, caseDocument]))
  const anatomyMapById = new Map(anatomyMaps.map((anatomyMap) => [anatomyMap.id, anatomyMap]))
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
  const caseIds = new Set(cases.map(({ id }) => id))
  const anatomyMapIds = new Set(anatomyMaps.map(({ id }) => id))
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
    expectedType?: AssetManifest['assets'][number]['type'],
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

  const validateAnatomyExploreSemantics = (
    primitive: AnatomyExplorePrimitive,
    file: string,
    path: string,
  ) => {
    const mapId = primitive.content.anatomyMapId
    requireRef(anatomyMapIds, mapId, file, `${path}.content.anatomyMapId`, 'anatomy map')
    const anatomyMap = anatomyMapById.get(mapId)
    if (!anatomyMap) return

    const structureIds = new Set(anatomyMap.structures.map(({ id }) => id))
    const waypointIds = new Set(anatomyMap.waypoints.map(({ id }) => id))
    if (primitive.content.startView.mode === 'marker') {
      requireRef(
        structureIds,
        primitive.content.startView.structureId,
        file,
        `${path}.content.startView.structureId`,
        'anatomy structure',
      )
    }
    if (
      primitive.content.startView.mode === 'waypoint' ||
      primitive.content.startView.mode === 'endoscopic'
    ) {
      requireRef(
        waypointIds,
        primitive.content.startView.waypointId,
        file,
        `${path}.content.startView.waypointId`,
        'anatomy waypoint',
      )
    }
    primitive.content.requiredStructureIds?.forEach((id, index) =>
      requireRef(
        structureIds,
        id,
        file,
        `${path}.content.requiredStructureIds.${index}`,
        'anatomy structure',
      ),
    )
    primitive.content.requiredWaypointIds?.forEach((id, index) =>
      requireRef(
        waypointIds,
        id,
        file,
        `${path}.content.requiredWaypointIds.${index}`,
        'anatomy waypoint',
      ),
    )
  }

  const validateAnatomyLocateSemantics = (
    primitive: AnatomyLocatePrimitive,
    file: string,
    path: string,
  ) => {
    const mapId = primitive.content.anatomyMapId
    requireRef(anatomyMapIds, mapId, file, `${path}.content.anatomyMapId`, 'anatomy map')
    const anatomyMap = anatomyMapById.get(mapId)
    if (!anatomyMap) return

    const levelOrder = new Map(anatomyMap.levels.map(({ id }, index) => [id, index]))
    const levelIds = new Set(levelOrder.keys())
    const structureById = new Map(
      anatomyMap.structures.map((structure) => [structure.id, structure]),
    )
    const structureIds = new Set(structureById.keys())
    const waypointIds = new Set(anatomyMap.waypoints.map(({ id }) => id))

    if (primitive.content.startView.mode === 'marker') {
      requireRef(
        structureIds,
        primitive.content.startView.structureId,
        file,
        `${path}.content.startView.structureId`,
        'anatomy structure',
      )
    }
    if (
      primitive.content.startView.mode === 'waypoint' ||
      primitive.content.startView.mode === 'endoscopic'
    ) {
      requireRef(
        waypointIds,
        primitive.content.startView.waypointId,
        file,
        `${path}.content.startView.waypointId`,
        'anatomy waypoint',
      )
    }

    let previousLevelOrder = -1
    let previousModelTarget: string | null = null
    primitive.content.levels.forEach((level, index) => {
      const levelPath = `${path}.content.levels.${index}`
      requireRef(levelIds, level.levelId, file, `${levelPath}.levelId`, 'anatomy level')
      const order = levelOrder.get(level.levelId)
      if (order !== undefined) {
        if (order <= previousLevelOrder) {
          issues.push({
            file,
            path: `${levelPath}.levelId`,
            message: 'Anatomy locate levels must follow the anatomy map level order.',
            severity: 'error',
          })
        }
        previousLevelOrder = Math.max(previousLevelOrder, order)
      }

      if (level.input !== 'model') return
      requireRef(
        structureIds,
        level.targetStructureId,
        file,
        `${levelPath}.targetStructureId`,
        'anatomy structure',
      )
      const target = structureById.get(level.targetStructureId)
      if (target && target.levelId !== level.levelId) {
        issues.push({
          file,
          path: `${levelPath}.targetStructureId`,
          message: `Anatomy structure "${target.id}" belongs to level "${target.levelId}", not "${level.levelId}".`,
          severity: 'error',
        })
      }
      if (target && previousModelTarget) {
        let ancestorId = target.parentId
        let descendsFromPrevious = false
        while (ancestorId) {
          if (ancestorId === previousModelTarget) {
            descendsFromPrevious = true
            break
          }
          ancestorId = structureById.get(ancestorId)?.parentId
        }
        if (!descendsFromPrevious) {
          issues.push({
            file,
            path: `${levelPath}.targetStructureId`,
            message: `Anatomy structure "${target.id}" must descend from the previous model target "${previousModelTarget}".`,
            severity: 'error',
          })
        }
      }
      if (target) previousModelTarget = target.id
    })
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
      if (result.primitive.type === 'anatomy_explore') {
        validateAnatomyExploreSemantics(result.primitive as AnatomyExplorePrimitive, file, path)
      }
      if (result.primitive.type === 'anatomy_locate') {
        validateAnatomyLocateSemantics(result.primitive as AnatomyLocatePrimitive, file, path)
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

  anatomyMaps.forEach((anatomyMap, anatomyMapIndex) => {
    const file = input.anatomyMapFiles[anatomyMapIndex]?.file ?? `anatomy-map:${anatomyMap.id}`
    const modelAsset = assetById.get(anatomyMap.modelAssetId)
    requireAsset(anatomyMap.modelAssetId, file, 'modelAssetId', 'model')

    const levelIds = new Set<string>()
    const levelOrder = new Map<string, number>()
    anatomyMap.levels.forEach((level, levelIndex) => {
      if (levelIds.has(level.id)) {
        issues.push({
          file,
          path: `levels.${levelIndex}.id`,
          message: `Duplicate anatomy level id "${level.id}".`,
          severity: 'error',
        })
      } else {
        levelIds.add(level.id)
        levelOrder.set(level.id, levelIndex)
      }
    })

    const structureIds = new Set<string>()
    const structureById = new Map(
      anatomyMap.structures.map((structure) => [structure.id, structure]),
    )
    const meshOwnersByLevel = new Map<string, Map<string, string>>()
    anatomyMap.structures.forEach((structure, structureIndex) => {
      const path = `structures.${structureIndex}`
      if (structureIds.has(structure.id)) {
        issues.push({
          file,
          path: `${path}.id`,
          message: `Duplicate anatomy structure id "${structure.id}".`,
          severity: 'error',
        })
      }
      structureIds.add(structure.id)
      requireRef(levelIds, structure.levelId, file, `${path}.levelId`, 'anatomy level')

      const structureLevel = levelOrder.get(structure.levelId)
      if (structureLevel === 0 && structure.parentId) {
        issues.push({
          file,
          path: `${path}.parentId`,
          message: 'Structures on the first anatomy level cannot declare a parent.',
          severity: 'error',
        })
      } else if (structureLevel !== undefined && structureLevel > 0 && !structure.parentId) {
        issues.push({
          file,
          path: `${path}.parentId`,
          message: 'Structures below the first anatomy level require a parent.',
          severity: 'error',
        })
      }

      if (structure.parentId) {
        const parent = structureById.get(structure.parentId)
        if (!parent) {
          issues.push({
            file,
            path: `${path}.parentId`,
            message: `Unknown anatomy structure reference "${structure.parentId}".`,
            severity: 'error',
          })
        } else {
          const parentLevel = levelOrder.get(parent.levelId)
          if (
            structureLevel !== undefined &&
            parentLevel !== undefined &&
            parentLevel >= structureLevel
          ) {
            issues.push({
              file,
              path: `${path}.parentId`,
              message: `Parent structure "${parent.id}" must belong to a prior anatomy level.`,
              severity: 'error',
            })
          }
        }
      }

      if ('meshNames' in structure) {
        structure.meshNames.forEach((meshName, meshIndex) => {
          const levelMeshOwners =
            meshOwnersByLevel.get(structure.levelId) ?? new Map<string, string>()
          meshOwnersByLevel.set(structure.levelId, levelMeshOwners)
          const existingOwner = levelMeshOwners.get(meshName)
          if (existingOwner && existingOwner !== structure.id) {
            issues.push({
              file,
              path: `${path}.meshNames.${meshIndex}`,
              message: `Mesh "${meshName}" is already bound to same-level structure "${existingOwner}".`,
              severity: 'error',
            })
          } else {
            levelMeshOwners.set(meshName, structure.id)
          }
        })
      }

      if (modelAsset?.type === 'model' && 'meshNames' in structure) {
        const modelMeshNames = new Set(modelAsset.meshNames)
        structure.meshNames.forEach((meshName, meshIndex) => {
          if (!modelMeshNames.has(meshName)) {
            issues.push({
              file,
              path: `${path}.meshNames.${meshIndex}`,
              message: `Mesh "${meshName}" is not present in model asset "${modelAsset.assetId}".`,
              severity: 'error',
            })
          }
        })
      }
    })

    validateAnatomyVolumes(
      anatomyMap.structures,
      modelAsset?.type === 'model' ? modelAsset.bounds : undefined,
      appConfig.product.anatomy3d.volumeValidation,
    ).forEach((issue) => {
      issues.push({
        file,
        path: `structures.${issue.structureIndex}.${issue.field}`,
        message: issue.message,
        severity: 'error',
      })
    })

    const waypointIds = new Set<string>()
    anatomyMap.waypoints.forEach((waypoint, waypointIndex) => {
      if (waypointIds.has(waypoint.id)) {
        issues.push({
          file,
          path: `waypoints.${waypointIndex}.id`,
          message: `Duplicate anatomy waypoint id "${waypoint.id}".`,
          severity: 'error',
        })
      }
      waypointIds.add(waypoint.id)
    })
    anatomyMap.waypoints.forEach((waypoint, waypointIndex) => {
      waypoint.next.forEach((nextId, nextIndex) =>
        requireRef(
          waypointIds,
          nextId,
          file,
          `waypoints.${waypointIndex}.next.${nextIndex}`,
          'anatomy waypoint',
        ),
      )
    })

    const waypointById = new Map(anatomyMap.waypoints.map((waypoint) => [waypoint.id, waypoint]))
    const visitedWaypoints = new Set<string>()
    const activeWaypoints = new Set<string>()
    let cyclicWaypoints = false
    const visitWaypoint = (waypointId: string) => {
      if (activeWaypoints.has(waypointId)) {
        cyclicWaypoints = true
        return
      }
      if (visitedWaypoints.has(waypointId)) return
      const waypoint = waypointById.get(waypointId)
      if (!waypoint) return
      activeWaypoints.add(waypointId)
      waypoint.next.forEach(visitWaypoint)
      activeWaypoints.delete(waypointId)
      visitedWaypoints.add(waypointId)
    }
    anatomyMap.waypoints.forEach(({ id }) => visitWaypoint(id))
    if (cyclicWaypoints) {
      issues.push({
        file,
        path: 'waypoints',
        message: `Anatomy waypoint graph "${anatomyMap.id}" must be acyclic.`,
        severity: 'error',
      })
    }
  })

  const stageOrder = ['orient', 'observe', 'interpret', 'diagnose'] as const
  const learnerVisibleCaseIds = new Set(appConfig.caseLab?.caseIds ?? [])
  cases.forEach((caseDocument, caseIndex) => {
    const file = input.caseFiles[caseIndex]?.file ?? `case:${caseDocument.id}`
    const clueIds = new Set(caseDocument.clues.map(({ id }) => id))
    const clueById = new Map(caseDocument.clues.map((clue) => [clue.id, clue]))
    const clueCategoryIds = new Set(appConfig.caseLab?.clueCategories.map(({ id }) => id) ?? [])
    const anatomyMap = anatomyMapById.get(caseDocument.anatomyMapId)
    const findingIds = new Set<string>()
    const hypothesisIds = new Set<string>()
    const usableClueIds = new Set<string>(
      caseDocument.entry.mode === 'clue_first' ? [caseDocument.entry.clueId] : [],
    )
    const usableFindingIds = new Set<string>()

    requireRef(anatomyMapIds, caseDocument.anatomyMapId, file, 'anatomyMapId', 'anatomy map')
    caseDocument.conceptIds.forEach((id, conceptIndex) =>
      requireRef(conceptIds, id, file, `conceptIds.${conceptIndex}`, 'concept'),
    )
    if (
      appConfig.caseLab &&
      !Object.hasOwn(appConfig.caseLab.organSystems, caseDocument.organSystem)
    ) {
      issues.push({
        file,
        path: 'organSystem',
        message: `Case organ system "${caseDocument.organSystem}" must resolve through caseLab.organSystems.`,
        severity: 'error',
      })
    }
    if (caseDocument.timing) {
      const estimatedSeconds = caseDocument.estimatedMinutes * 60
      if (
        estimatedSeconds < caseDocument.timing.caseTargetSeconds ||
        estimatedSeconds > caseDocument.timing.caseMaxSeconds
      ) {
        issues.push({
          file,
          path: 'estimatedMinutes',
          message:
            'Case estimatedMinutes must fall between timing.caseTargetSeconds and timing.caseMaxSeconds.',
          severity: 'error',
        })
      }
    }
    if (caseDocument.patient.imageAssetId) {
      requireAsset(caseDocument.patient.imageAssetId, file, 'patient.imageAssetId', 'image')
    }
    caseDocument.differential?.forEach((hypothesis, hypothesisIndex) => {
      if (hypothesisIds.has(hypothesis.id)) {
        issues.push({
          file,
          path: `differential.${hypothesisIndex}.id`,
          message: `Duplicate case differential id "${hypothesis.id}".`,
          severity: 'error',
        })
      }
      hypothesisIds.add(hypothesis.id)
    })

    const structureIds = new Set(anatomyMap?.structures.map(({ id }) => id) ?? [])
    const waypointById = new Map(
      anatomyMap?.waypoints.map((waypoint) => [waypoint.id, waypoint]) ?? [],
    )
    caseDocument.findings?.forEach((finding, findingIndex) => {
      const path = `findings.${findingIndex}`
      if (findingIds.has(finding.id)) {
        issues.push({
          file,
          path: `${path}.id`,
          message: `Duplicate case finding id "${finding.id}".`,
          severity: 'error',
        })
      }
      findingIds.add(finding.id)

      if (finding.anchor.type === 'structure') {
        requireRef(
          structureIds,
          finding.anchor.structure,
          file,
          `${path}.anchor.structure`,
          'anatomy structure',
        )
        return
      }

      requireRef(
        new Set(waypointById.keys()),
        finding.anchor.waypoint,
        file,
        `${path}.anchor.waypoint`,
        'anatomy waypoint',
      )
      requireRef(
        new Set(waypointById.keys()),
        finding.anchor.toWaypoint,
        file,
        `${path}.anchor.toWaypoint`,
        'anatomy waypoint',
      )
      const waypoint = waypointById.get(finding.anchor.waypoint)
      if (waypoint && !waypoint.next.includes(finding.anchor.toWaypoint)) {
        issues.push({
          file,
          path: `${path}.anchor.toWaypoint`,
          message: `Finding path must follow a configured edge from "${finding.anchor.waypoint}" to "${finding.anchor.toWaypoint}".`,
          severity: 'error',
        })
      }
    })

    const duplicateClueIds = new Set<string>()
    const seenPrimitiveIds = new Set<string>()
    const stepIds = new Set<string>()
    const scoredStepIds = new Set<string>()
    caseDocument.clues.forEach((clue, clueIndex) => {
      if (duplicateClueIds.has(clue.id)) {
        issues.push({
          file,
          path: `clues.${clueIndex}.id`,
          message: `Duplicate clue id "${clue.id}" within this case.`,
          severity: 'error',
        })
      }
      duplicateClueIds.add(clue.id)
      if (seenPrimitiveIds.has(clue.primitive.id)) {
        issues.push({
          file,
          path: `clues.${clueIndex}.primitive.id`,
          message: `Duplicate primitive id "${clue.primitive.id}" across case clues and stages.`,
          severity: 'error',
        })
      }
      seenPrimitiveIds.add(clue.primitive.id)
      requireRef(
        clueCategoryIds,
        clue.category,
        file,
        `clues.${clueIndex}.category`,
        'clue category',
      )
      if (!contentPrimitiveTypeSet.has(clue.primitive.type)) {
        issues.push({
          file,
          path: `clues.${clueIndex}.primitive.type`,
          message: `Clue primitive type "${clue.primitive.type}" is not content-only.`,
          severity: 'error',
        })
      }
      if (
        clue.primitive.reward ||
        clue.primitive.timer ||
        clue.primitive.scoring.xp !== undefined ||
        clue.primitive.scoring.weight !== 1
      ) {
        issues.push({
          file,
          path: `clues.${clueIndex}.primitive.scoring`,
          message: 'Clue primitives cannot carry scored, timed, or rewarded behavior.',
          severity: 'error',
        })
      }
      validatePrimitive(clue.primitive, file, `clues.${clueIndex}.primitive`)
    })

    const seenStageIds = new Set<string>()
    const seenStageKinds = new Set<string>()
    let priorStageOrder = -1
    const stageByStepId = new Map<
      string,
      { component: 'anatomy' | 'diagnosis' | 'none'; step: Primitive }
    >()
    const referencedClueIds = new Set<string>()
    const orientAnatomySteps: Array<AnatomyExplorePrimitive | AnatomyLocatePrimitive> = []

    caseDocument.stages.forEach((stage, stageIndex) => {
      stage.clueIds.forEach((id) => {
        usableClueIds.add(id)
        referencedClueIds.add(id)
      })
      if (seenStageIds.has(stage.id)) {
        issues.push({
          file,
          path: `stages.${stageIndex}.id`,
          message: `Duplicate case stage id "${stage.id}".`,
          severity: 'error',
        })
      }
      seenStageIds.add(stage.id)

      const order = stageOrder.indexOf(stage.kind)
      if (seenStageKinds.has(stage.kind)) {
        issues.push({
          file,
          path: `stages.${stageIndex}.kind`,
          message: `Duplicate case stage kind "${stage.kind}".`,
          severity: 'error',
        })
      }
      if (order <= priorStageOrder) {
        issues.push({
          file,
          path: `stages.${stageIndex}.kind`,
          message: 'Case stages must follow orient, observe, interpret, diagnose order.',
          severity: 'error',
        })
      }
      seenStageKinds.add(stage.kind)
      priorStageOrder = Math.max(priorStageOrder, order)

      stage.steps.forEach((step, stepIndex) => {
        const path = `stages.${stageIndex}.steps.${stepIndex}`
        if (seenPrimitiveIds.has(step.id)) {
          issues.push({
            file,
            path: `${path}.id`,
            message: `Duplicate primitive id "${step.id}" across case clues and stages.`,
            severity: 'error',
          })
        }
        seenPrimitiveIds.add(step.id)
        stepIds.add(step.id)
        stageByStepId.set(step.id, { component: stage.component, step })
        collectClueIdReferences(step).forEach(({ id }) => referencedClueIds.add(id))
        validatePrimitive(step, file, path)
        const parsedStep = parsePrimitive(step).primitive
        if (
          parsedStep &&
          (assessmentPrimitiveTypeSet.has(parsedStep.type) ||
            parsedStep.type === 'scenario' ||
            parsedStep.type === 'dicom_identify_region' ||
            parsedStep.type === 'dicom_measure' ||
            (parsedStep.type === 'dicom_guided' && Boolean(parsedStep.content.checkpoint)) ||
            (parsedStep.type === 'image_hotspot' && parsedStep.content.mode === 'assess'))
        ) {
          scoredStepIds.add(step.id)
          if (!step.clueIds?.length) {
            issues.push({
              file,
              path: `${path}.clueIds`,
              message: `Scored case task "${step.id}" must declare its decisive clueIds.`,
              severity: 'error',
            })
          }
          if (learnerVisibleCaseIds.has(caseDocument.id)) {
            const clueTokens = new Set<string>()
            step.clueIds?.forEach((clueId) => {
              const clue = clueById.get(clueId)
              if (!clue) return
              collectNumericTokens(clue.primitive.content).forEach((token) => clueTokens.add(token))
            })
            const leakedTokens = new Set<string>()
            collectAssessmentPromptText(step.content).forEach((text) => {
              collectNumericTokens(text).forEach((token) => {
                if (clueTokens.has(token)) leakedTokens.add(token)
              })
            })
            if (leakedTokens.size > 0) {
              issues.push({
                file,
                path: `${path}.content`,
                message: `Learner-visible task repeats numeric clue value(s) ${[
                  ...leakedTokens,
                ].join(', ')} in its prompt or options.`,
                severity: 'error',
              })
            }
          }
        }
        if (parsedStep?.type === 'anatomy_explore' || parsedStep?.type === 'anatomy_locate') {
          const anatomyStep = parsedStep as AnatomyExplorePrimitive | AnatomyLocatePrimitive
          if (stage.kind === 'orient') orientAnatomySteps.push(anatomyStep)
          const referencedFindingIds = anatomyStep.content.findingIds ?? []
          referencedFindingIds.forEach((id) => usableFindingIds.add(id))
          referencedFindingIds.forEach((id, findingIndex) =>
            requireRef(
              findingIds,
              id,
              file,
              `${path}.content.findingIds.${findingIndex}`,
              'case finding',
            ),
          )
          if (
            referencedFindingIds.length > 0 &&
            anatomyStep.content.anatomyMapId !== caseDocument.anatomyMapId
          ) {
            issues.push({
              file,
              path: `${path}.content.anatomyMapId`,
              message: 'Anatomy steps with findings must use the case anatomy map.',
              severity: 'error',
            })
          }
          if (anatomyStep.type === 'anatomy_explore') {
            anatomyStep.content.requiredFindingIds?.forEach((id, findingIndex) =>
              requireRef(
                findingIds,
                id,
                file,
                `${path}.content.requiredFindingIds.${findingIndex}`,
                'case finding',
              ),
            )
          }
        }
        if (parsedStep?.type === 'case_differential') {
          const differentialStep = parsedStep as CaseDifferentialPrimitive
          differentialStep.content.hypotheses.forEach((hypothesis, hypothesisIndex) =>
            requireRef(
              hypothesisIds,
              hypothesis.id,
              file,
              `${path}.content.hypotheses.${hypothesisIndex}.id`,
              'case differential',
            ),
          )
          if (stage.kind !== 'observe' && stage.kind !== 'interpret') {
            issues.push({
              file,
              path: `${path}.type`,
              message: 'case_differential may only appear in Observe or Interpret stages.',
              severity: 'error',
            })
          }
        }
        if (parsedStep?.type === 'case_evidence_select') {
          const evidenceStep = parsedStep as CaseEvidenceSelectPrimitive
          evidenceStep.content.evidence.forEach((ref, evidenceIndex) =>
            requireRef(
              ref.kind === 'clue' ? clueIds : findingIds,
              ref.id,
              file,
              `${path}.content.evidence.${evidenceIndex}.id`,
              `case ${ref.kind}`,
            ),
          )
          evidenceStep.content.correctEvidence.forEach((ref, evidenceIndex) =>
            requireRef(
              ref.kind === 'clue' ? clueIds : findingIds,
              ref.id,
              file,
              `${path}.content.correctEvidence.${evidenceIndex}.id`,
              `case ${ref.kind}`,
            ),
          )
          const correctClueIds = new Set(
            evidenceStep.content.correctEvidence.flatMap((ref) =>
              ref.kind === 'clue' ? [ref.id] : [],
            ),
          )
          if (step.clueIds?.some((id) => !correctClueIds.has(id))) {
            issues.push({
              file,
              path: `${path}.content.correctEvidence`,
              message: 'Evidence citation must include every decisive clue in correctEvidence.',
              severity: 'error',
            })
          }
          if (stage.kind !== 'diagnose') {
            issues.push({
              file,
              path: `${path}.type`,
              message: 'case_evidence_select must appear in the Diagnose stage.',
              severity: 'error',
            })
          }
        }
      })

      if (
        learnerVisibleCaseIds.has(caseDocument.id) &&
        (stage.kind === 'observe' || stage.kind === 'interpret') &&
        caseDocument.differential?.length &&
        stage.steps.at(-1)?.type !== 'case_differential'
      ) {
        issues.push({
          file,
          path: `stages.${stageIndex}.steps`,
          message: `${stage.title} must end with a case_differential checkpoint.`,
          severity: 'error',
        })
      }
      if (
        learnerVisibleCaseIds.has(caseDocument.id) &&
        caseDocument.differential?.length &&
        stage.kind === 'diagnose' &&
        !stage.steps.slice(0, -1).some(({ type }) => type === 'case_evidence_select')
      ) {
        issues.push({
          file,
          path: `stages.${stageIndex}.steps`,
          message: 'Diagnose must include case_evidence_select before the final conclusion.',
          severity: 'error',
        })
      }
    })

    caseDocument.findings?.forEach(({ clueIds: findingClueIds }) =>
      findingClueIds.forEach((id) => referencedClueIds.add(id)),
    )
    caseDocument.expertBenchmark.evidenceWeights.forEach(({ ref }) => {
      if (ref.kind === 'clue') referencedClueIds.add(ref.id)
    })
    caseDocument.debrief.keyEvidence.forEach(({ ref }) => {
      if (ref.kind === 'clue') referencedClueIds.add(ref.id)
    })
    caseDocument.clues.forEach(({ id }, clueIndex) => {
      if (!referencedClueIds.has(id)) {
        issues.push({
          file,
          path: `clues.${clueIndex}.id`,
          message: `Case clue "${id}" is not referenced by a stage, step, finding, debrief, or expert evidence.`,
          severity: 'error',
        })
      }
    })

    const entryConsumed = orientAnatomySteps.some((step) => {
      if (caseDocument.entry.mode === 'clue_first') {
        return step.clueIds?.includes(caseDocument.entry.clueId) ?? false
      }
      if (caseDocument.entry.mode === 'overview_marker') {
        return (
          step.content.startView.mode === 'marker' &&
          step.content.startView.structureId === caseDocument.entry.markerStructureId
        )
      }
      if (caseDocument.entry.mode === 'unknown_waypoint') {
        return step.type === 'anatomy_explore' && step.content.navigation !== 'orbit'
      }
      return (
        step.content.startView.mode === 'endoscopic' &&
        step.content.startView.waypointId === caseDocument.entry.waypointId
      )
    })
    if (!entryConsumed) {
      issues.push({
        file,
        path: 'entry',
        message: `Case entry mode "${caseDocument.entry.mode}" must be consumed by an anatomy primitive in the orient stage.`,
        severity: 'error',
      })
    }

    collectClueIdReferences(caseDocument).forEach(({ id, path }) =>
      requireRef(clueIds, id, file, path, 'clue'),
    )
    if (anatomyMap) {
      const anatomyMapIndex = anatomyMaps.indexOf(anatomyMap)
      const anatomyMapFile =
        input.anatomyMapFiles[anatomyMapIndex]?.file ?? `anatomy-map:${anatomyMap.id}`
      collectClueIdReferences(anatomyMap).forEach(({ id, path }) =>
        requireRef(clueIds, id, anatomyMapFile, path, 'clue'),
      )
    }

    caseDocument.expertBenchmark.openedClueIds.forEach((id, clueIndex) =>
      requireRef(clueIds, id, file, `expertBenchmark.openedClueIds.${clueIndex}`, 'clue'),
    )
    Object.keys(caseDocument.expertBenchmark.responses).forEach((id) =>
      requireRef(stepIds, id, file, `expertBenchmark.responses.${id}`, 'case primitive'),
    )
    Object.keys(caseDocument.expertBenchmark.rationales ?? {}).forEach((id) =>
      requireRef(stepIds, id, file, `expertBenchmark.rationales.${id}`, 'case primitive'),
    )
    Object.keys(caseDocument.expertBenchmark.stepTimings).forEach((id) =>
      requireRef(stepIds, id, file, `expertBenchmark.stepTimings.${id}`, 'case primitive'),
    )
    if (learnerVisibleCaseIds.has(caseDocument.id)) {
      stepIds.forEach((id) => {
        if (!(id in caseDocument.expertBenchmark.responses)) {
          issues.push({
            file,
            path: `expertBenchmark.responses.${id}`,
            message: `Learner-visible task "${id}" requires a benchmark response.`,
            severity: 'error',
          })
        }
        if (!caseDocument.expertBenchmark.rationales[id]) {
          issues.push({
            file,
            path: `expertBenchmark.rationales.${id}`,
            message: `Learner-visible task "${id}" requires an expert rationale.`,
            severity: 'error',
          })
        }
      })
      scoredStepIds.forEach((id) => {
        if (!caseDocument.expertBenchmark.stepTimings[id]) {
          issues.push({
            file,
            path: `expertBenchmark.stepTimings.${id}`,
            message: `Learner-visible scored task "${id}" requires benchmark timing facts.`,
            severity: 'error',
          })
        }
      })
    }

    if (appConfig.caseLab) {
      const timingMode = appConfig.caseLab.tiers[caseDocument.tier].timing
      const benchmarkScore = calculateCaseScore({
        timingMode,
        steps: [...stageByStepId.entries()].map(([id, { component, step }]) => {
          const resolved = resolvePrimitiveDefinition(step)
          const timing = caseDocument.expertBenchmark.stepTimings[id]
          const evaluation = evaluatePrimitive(step, caseDocument.expertBenchmark.responses[id])
          const scoring = step.scoring as {
            targetSeconds?: unknown
            maxSeconds?: unknown
          }
          return {
            component,
            scored: resolved?.definition.scored(resolved.primitive) ?? false,
            firstAttemptScore: evaluation.score,
            weight: step.scoring.weight,
            elapsedMs: timing?.elapsedMs,
            targetSeconds:
              typeof scoring.targetSeconds === 'number' ? scoring.targetSeconds : undefined,
            maxSeconds:
              typeof scoring.maxSeconds === 'number'
                ? scoring.maxSeconds
                : step.timer?.durationSeconds,
            timedOut: timing?.timedOut,
          }
        }),
        clues: caseDocument.clues,
        openedClueIds: caseDocument.expertBenchmark.openedClueIds,
        clueOpenContexts: {},
        durationMs: caseDocument.expertBenchmark.durationSeconds * 1_000,
        caseTargetSeconds: caseDocument.timing?.caseTargetSeconds,
        caseMaxSeconds: caseDocument.timing?.caseMaxSeconds,
        caseClockExpired: false,
        config: appConfig.caseLab.scoring,
      })
      const expected = caseDocument.expertBenchmark.breakdown
      for (const component of ['anatomy', 'diagnosis', 'speed'] as const) {
        if (Math.abs(benchmarkScore[component] - expected[component]) > 0.000001) {
          issues.push({
            file,
            path: `expertBenchmark.breakdown.${component}`,
            message: `Expert benchmark ${component} breakdown must equal pure scorer recomputation (${benchmarkScore[component]}).`,
            severity: 'error',
          })
        }
      }
    }

    const validateEvidenceRef = (ref: { kind: 'clue' | 'finding'; id: string }, path: string) => {
      const ids = ref.kind === 'clue' ? clueIds : findingIds
      const usableIds = ref.kind === 'clue' ? usableClueIds : usableFindingIds
      requireRef(ids, ref.id, file, `${path}.id`, `case ${ref.kind}`)
      if (ids.has(ref.id) && !usableIds.has(ref.id)) {
        issues.push({
          file,
          path: `${path}.id`,
          message: `Case ${ref.kind} "${ref.id}" is not available through a case stage.`,
          severity: 'error',
        })
      }
    }

    caseDocument.expertBenchmark.evidenceWeights.forEach(({ ref }, evidenceIndex) =>
      validateEvidenceRef(ref, `expertBenchmark.evidenceWeights.${evidenceIndex}.ref`),
    )
    caseDocument.debrief.keyEvidence.forEach(({ ref, stepIds: affectedStepIds }, evidenceIndex) => {
      const path = `debrief.keyEvidence.${evidenceIndex}`
      validateEvidenceRef(ref, `${path}.ref`)
      affectedStepIds.forEach((id, stepIndex) =>
        requireRef(stepIds, id, file, `${path}.stepIds.${stepIndex}`, 'case primitive'),
      )
    })

    if (caseDocument.entry.mode === 'clue_first') {
      requireRef(clueIds, caseDocument.entry.clueId, file, 'entry.clueId', 'clue')
    }
    if (caseDocument.entry.mode === 'overview_marker' && anatomyMap?.structures) {
      requireRef(
        new Set(anatomyMap.structures.map(({ id }) => id)),
        caseDocument.entry.markerStructureId,
        file,
        'entry.markerStructureId',
        'anatomy structure',
      )
    }
    if (caseDocument.entry.mode === 'endoscopic' && anatomyMap?.waypoints) {
      requireRef(
        new Set(anatomyMap.waypoints.map(({ id }) => id)),
        caseDocument.entry.waypointId,
        file,
        'entry.waypointId',
        'anatomy waypoint',
      )
    }
    if (caseDocument.entry.mode === 'unknown_waypoint' && anatomyMap?.waypoints) {
      const waypointIds = new Set(anatomyMap.waypoints.map(({ id }) => id))
      if (
        new Set(caseDocument.entry.candidateWaypointIds).size !==
        caseDocument.entry.candidateWaypointIds.length
      ) {
        issues.push({
          file,
          path: 'entry.candidateWaypointIds',
          message: 'Unknown-waypoint candidates must be unique.',
          severity: 'error',
        })
      }
      const entryLocateSteps = caseDocument.stages
        .flatMap(({ steps }) => steps)
        .flatMap((step) => {
          const parsed = parsePrimitive(step).primitive
          return parsed?.type === 'anatomy_locate' &&
            (parsed.content as { answerFrom?: string }).answerFrom === 'entry'
            ? [parsed as AnatomyLocatePrimitive]
            : []
        })
      if (entryLocateSteps.length === 0) {
        issues.push({
          file,
          path: 'entry',
          message: 'Unknown-waypoint entry requires an anatomy_locate step with answerFrom entry.',
          severity: 'error',
        })
      }
      caseDocument.entry.candidateWaypointIds.forEach((candidateId, candidateIndex) => {
        requireRef(
          waypointIds,
          candidateId,
          file,
          `entry.candidateWaypointIds.${candidateIndex}`,
          'anatomy waypoint',
        )
        const waypoint = anatomyMap.waypoints.find(({ id }) => id === candidateId)
        if (!waypoint) return
        if (!waypoint.neutralLabel) {
          issues.push({
            file,
            path: `entry.candidateWaypointIds.${candidateIndex}`,
            message: `Unknown-waypoint candidate "${candidateId}" requires a neutralLabel.`,
            severity: 'error',
          })
        }
        entryLocateSteps.forEach((step) => {
          const benchmark = caseDocument.expertBenchmark.responses[step.id]
          const benchmarkResponse =
            benchmark && typeof benchmark === 'object' && !Array.isArray(benchmark)
              ? (benchmark as Record<string, unknown>)
              : {}
          step.content.levels.forEach((level) => {
            const answerId = waypoint.answerIds?.[level.levelId]
            const validAnswer =
              answerId !== undefined &&
              (level.input === 'model'
                ? anatomyMap.structures.some(
                    ({ id, levelId }) => id === answerId && levelId === level.levelId,
                  )
                : level.input === 'image'
                  ? level.regions.some(({ id }) => id === answerId)
                  : level.options.some(({ id }) => id === answerId))
            if (!validAnswer) {
              issues.push({
                file,
                path: `entry.candidateWaypointIds.${candidateIndex}`,
                message: `Candidate "${candidateId}" has no valid ${level.levelId} answer.`,
                severity: 'error',
              })
            } else if (benchmarkResponse[level.levelId] !== answerId) {
              issues.push({
                file,
                path: `expertBenchmark.responses.${step.id}.${level.levelId}`,
                message: `Benchmark must match candidate "${candidateId}" for answerFrom entry.`,
                severity: 'error',
              })
            }
          })
        })
      })
    }
  })

  const caseAnatomyMapIds = new Set(cases.map(({ anatomyMapId }) => anatomyMapId))
  anatomyMaps.forEach((anatomyMap, anatomyMapIndex) => {
    if (caseAnatomyMapIds.has(anatomyMap.id)) return
    const file = input.anatomyMapFiles[anatomyMapIndex]?.file ?? `anatomy-map:${anatomyMap.id}`
    rejectClueReferencesOutsideCases(anatomyMap, file)
  })

  if (appConfig.caseLab) {
    const configuredCaseIds = new Set<string>()
    appConfig.caseLab.caseIds.forEach((id, index) => {
      if (configuredCaseIds.has(id)) {
        issues.push({
          file: input.appConfigFile,
          path: `caseLab.caseIds.${index}`,
          message: `Duplicate configured case id "${id}".`,
          severity: 'error',
        })
      }
      configuredCaseIds.add(id)
      requireRef(caseIds, id, input.appConfigFile, `caseLab.caseIds.${index}`, 'case')
    })
    if (!configuredCaseIds.has(appConfig.caseLab.featuredCaseId)) {
      issues.push({
        file: input.appConfigFile,
        path: 'caseLab.featuredCaseId',
        message: 'The featured case must also appear in caseLab.caseIds.',
        severity: 'error',
      })
    }
    const clueCategoryIds = new Set<string>()
    appConfig.caseLab.clueCategories.forEach(({ id }, index) => {
      if (clueCategoryIds.has(id)) {
        issues.push({
          file: input.appConfigFile,
          path: `caseLab.clueCategories.${index}.id`,
          message: `Duplicate clue category id "${id}".`,
          severity: 'error',
        })
      }
      clueCategoryIds.add(id)
    })
    requireRef(
      caseIds,
      appConfig.caseLab.featuredCaseId,
      input.appConfigFile,
      'caseLab.featuredCaseId',
      'case',
    )
    requireRef(
      caseIds,
      appConfig.caseLab.dailyQuickCaseId,
      input.appConfigFile,
      'caseLab.dailyQuickCaseId',
      'case',
    )
  } else if (cases.length > 0) {
    issues.push({
      file: input.appConfigFile,
      path: 'caseLab',
      message: 'caseLab configuration is required when cases are present.',
      severity: 'error',
    })
  }

  appConfig.challenges.forEach((challenge, challengeIndex) => {
    if (challenge.items !== undefined) {
      const itemPath = `challenges.${challengeIndex}.items`
      requireUniquePrimitiveIds(challenge.items, input.appConfigFile, itemPath)
      challenge.items.forEach((primitive, primitiveIndex) => {
        validatePrimitive(primitive, input.appConfigFile, `${itemPath}.${primitiveIndex}`)
      })
      return
    }

    requireRef(
      caseIds,
      challenge.caseId,
      input.appConfigFile,
      `challenges.${challengeIndex}.caseId`,
      'case',
    )
    if (
      challenge.type === 'daily' &&
      appConfig.caseLab &&
      challenge.caseId !== appConfig.caseLab.dailyQuickCaseId
    ) {
      issues.push({
        file: input.appConfigFile,
        path: `challenges.${challengeIndex}.caseId`,
        message: `Daily case challenge "${challenge.id}" must reference caseLab.dailyQuickCaseId "${appConfig.caseLab.dailyQuickCaseId}".`,
        severity: 'error',
      })
    }
  })

  for (const pathway of appConfig.pathways) {
    const nodeIds = new Set(pathway.nodes.map(({ id }) => id))
    pathway.nodes.forEach((node, index) => {
      const refs =
        node.type === 'challenge' ? challengeIds : node.type === 'case' ? caseIds : lessonIds
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

  if (appConfig.demo?.enabled) {
    if (manifest.defaultSeed !== appConfig.demo.defaultProfile) {
      issues.push({
        file: input.appConfigFile,
        path: 'demo.defaultProfile',
        message: 'The enabled demo default profile must match manifest.defaultSeed.',
        severity: 'error',
      })
    }
    const profileIds = new Set<string>()
    const seedProfiles = new Set<string>()
    appConfig.demo.profiles.forEach((profile, index) => {
      if (profileIds.has(profile.id)) {
        issues.push({
          file: input.appConfigFile,
          path: `demo.profiles.${index}.id`,
          message: `Duplicate demo profile id "${profile.id}".`,
          severity: 'error',
        })
      }
      if (seedProfiles.has(profile.seedProfile)) {
        issues.push({
          file: input.appConfigFile,
          path: `demo.profiles.${index}.seedProfile`,
          message: `Duplicate demo seed profile "${profile.seedProfile}".`,
          severity: 'error',
        })
      }
      profileIds.add(profile.id)
      seedProfiles.add(profile.seedProfile)
      if (!manifest.seeds[profile.seedProfile]) {
        issues.push({
          file: input.appConfigFile,
          path: `demo.profiles.${index}.seedProfile`,
          message: `Unknown demo seed profile "${profile.seedProfile}".`,
          severity: 'error',
        })
      }
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
    cases: Object.freeze(cases),
    anatomyMaps: Object.freeze(anatomyMaps),
    seed,
    assetManifest,
    courseById,
    lessonById,
    caseById,
    anatomyMapById,
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
  const caseFiles = parsedManifest.cases.map((path) => resolveContentPath(baseUrl, path))
  const anatomyMapFiles = parsedManifest.anatomyMaps.map((path) =>
    resolveContentPath(baseUrl, path),
  )
  const [appConfig, seed, assetManifest, courses, cases, anatomyMaps] = await Promise.all([
    fetchJson(appConfigFile),
    fetchJson(seedFile),
    fetchJson(assetManifestFile),
    Promise.all(courseFiles.map(fetchJson)),
    Promise.all(caseFiles.map(fetchJson)),
    Promise.all(anatomyMapFiles.map(fetchJson)),
  ])

  return validateContentBundle({
    manifestFile,
    manifest,
    appConfigFile,
    appConfig,
    courseFiles: courseFiles.map((file, index) => ({ file, data: courses[index] })),
    caseFiles: caseFiles.map((file, index) => ({ file, data: cases[index] })),
    anatomyMapFiles: anatomyMapFiles.map((file, index) => ({
      file,
      data: anatomyMaps[index],
    })),
    seedFile,
    seed,
    assetManifestFile,
    assetManifest,
  })
}
