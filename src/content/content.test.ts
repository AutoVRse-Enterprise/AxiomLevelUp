import anatomyMapFixture from '../../public/content/fixtures/anatomy-map.json'
import caseFixture from '../../public/content/fixtures/case.json'
import invalidChallengePrimitive from '../../public/content/fixtures/invalid-challenge-primitive.json'
import invalidCaseCluePrimitive from '../../public/content/fixtures/invalid-case-clue-primitive.json'
import invalidCaseSemantics from '../../public/content/fixtures/invalid-case-semantics.json'
import invalidCourse from '../../public/content/fixtures/invalid-course.json'
import unknownPrimitive from '../../public/content/fixtures/unknown-primitive.json'
import advancedSeed from '../../public/content/seeds/advanced.json'
import { describe, expect, it, vi } from 'vitest'

import { ContentValidationError, loadContent, validateContentBundle } from '@/content/loader'
import {
  appConfigSchema,
  anatomyMapSchema,
  assetManifestSchema,
  caseDocumentSchema,
  courseSchema,
  learnerSeedSchema,
  parsePrimitive,
} from '@/content/schema'
import { contentResponses, makeValidContentBundle } from '@/test/contentFixtures'

function withCaseFixture(caseDocument: unknown = caseFixture) {
  const bundle = makeValidContentBundle()
  bundle.caseFiles = [{ file: 'fixtures/case.json', data: structuredClone(caseDocument) }]
  bundle.anatomyMapFiles.push({
    file: 'fixtures/anatomy-map.json',
    data: structuredClone(anatomyMapFixture),
  })
  const assetManifest = bundle.assetManifest as { assets: unknown[] }
  assetManifest.assets.push({
    assetId: 'fixture-anatomy-model',
    path: '/assets/models/fixture.glb',
    type: 'model',
    mimeType: 'model/gltf-binary',
    offlineRequired: false,
    offlineAvailable: false,
    sizeBytes: 1024,
    sha256: '1'.repeat(64),
    meshNames: ['root-region', 'target-structure'],
    triangleCount: 12,
    bounds: { min: [-1, -1, -1], max: [1, 1, 1] },
  })
  const appConfig = bundle.appConfig as Record<string, unknown>
  appConfig.caseLab = {
    title: 'Case Lab',
    featuredCaseId: 'case-contract-fixture',
    caseIds: ['case-contract-fixture'],
    dailyQuickCaseId: 'case-contract-fixture',
    clueCategories: [{ id: 'evidence', label: 'Evidence' }],
    tiers: {
      foundation: {
        label: 'Basic',
        timing: 'none',
        hints: 'full',
        labelEssentialClues: true,
      },
      intermediate: {
        label: 'Intermediate',
        timing: 'stopwatch',
        hints: 'full',
        labelEssentialClues: true,
      },
      advanced: {
        label: 'Advanced',
        timing: 'countdown',
        hints: 'reduced',
        labelEssentialClues: false,
      },
    },
    scoring: {
      weights: { anatomy: 0.4, diagnosis: 0.4, speed: 0.2 },
      speedBlend: { perStep: 0.5, perCase: 0.5 },
      defaultStepTargetSeconds: 20,
      defaultStepMaxSeconds: 90,
      cluePenalty: { perOptionalClue: 2, cap: 10 },
    },
    xp: { caseComplete: 100, perfectCaseBonus: 40 },
    historyLimit: 10,
  }
  return bundle
}

describe('content schemas', () => {
  it('accepts the advanced learner seed', () => {
    expect(learnerSeedSchema.parse(advancedSeed).learner.name).toBe('Maya Chen')
  })

  it('defaults course visibility to learner', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles[0]!.data as { visibility?: string }
    delete course.visibility

    expect(courseSchema.parse(course).visibility).toBe('learner')
  })

  it('defaults presentation effects for older product configuration', () => {
    const bundle = makeValidContentBundle()
    const appConfig = structuredClone(bundle.appConfig) as {
      product: { presentation?: unknown; anatomy3d?: unknown }
    }
    delete appConfig.product.presentation
    delete appConfig.product.anatomy3d

    const product = appConfigSchema.parse(appConfig).product
    expect(product.presentation).toEqual(
      expect.objectContaining({
        confetti: expect.objectContaining({ particleCount: 80 }),
        haptics: expect.objectContaining({ correctAnswer: [15] }),
      }),
    )
    expect(product.anatomy3d).toEqual(
      expect.objectContaining({
        pixelRatioCap: 1.5,
        maxTriangleCountWarning: 150_000,
        lumen: expect.objectContaining({ defaultRadius: 0.06 }),
      }),
    )
  })

  it('rejects the invalid course with useful paths', () => {
    const result = courseSchema.safeParse(invalidCourse)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('title')
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('estimatedMinutes')
    }
  })

  it('accepts the asset manifest v0.2 integrity contract', () => {
    const manifest = assetManifestSchema.parse({
      schemaVersion: '0.2',
      assets: [
        {
          assetId: 'transcript',
          path: '/assets/transcript.vtt',
          type: 'text',
          offlineRequired: true,
          offlineAvailable: true,
          sizeBytes: 128,
          sha256: '0'.repeat(64),
          mimeType: 'text/vtt',
          width: 1920,
          height: 1080,
        },
      ],
    })

    expect(manifest.assets[0]).toEqual(
      expect.objectContaining({
        type: 'text',
        mimeType: 'text/vtt',
        width: 1920,
        height: 1080,
      }),
    )
  })

  it('requires complete online-only metadata for model assets', () => {
    const model = {
      assetId: 'prepared-model',
      path: '/assets/models/prepared.glb',
      type: 'model',
      mimeType: 'model/gltf-binary',
      offlineRequired: false,
      offlineAvailable: false,
      sizeBytes: 2048,
      sha256: 'a'.repeat(64),
      meshNames: ['mesh-a'],
      triangleCount: 24,
      bounds: { min: [-1, -2, -3], max: [1, 2, 3] },
      provenance: {
        sourceUrl: 'https://example.test/model',
        licence: 'CC BY 4.0',
        author: 'Fixture author',
      },
    }

    expect(assetManifestSchema.parse({ schemaVersion: '0.2', assets: [model] }).assets[0]).toEqual(
      expect.objectContaining({ type: 'model', offlineAvailable: false }),
    )
    expect(
      assetManifestSchema.safeParse({
        schemaVersion: '0.2',
        assets: [{ ...model, offlineAvailable: true }],
      }).success,
    ).toBe(false)
  })

  it('keeps an unknown primitive as a warning', () => {
    const result = parsePrimitive(unknownPrimitive)

    expect(result.issues).toEqual([])
    expect(result.primitive?.type).toBe('future_lab_simulation')
    expect(result.warnings[0]).toContain('runtime fallback')
  })

  it('accepts the case document and anatomy-map fixture contracts', () => {
    expect(caseDocumentSchema.parse(caseFixture).id).toBe('case-contract-fixture')
    expect(anatomyMapSchema.parse(anatomyMapFixture).id).toBe('fixture-anatomy')
  })

  it('rejects assessment primitives used as case clues with a useful path', () => {
    expect(() => validateContentBundle(withCaseFixture(invalidCaseCluePrimitive))).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            file: 'fixtures/case.json',
            path: 'clues.0.primitive.type',
          }),
        ]),
      }),
    )
  })
})

describe('content loader', () => {
  it('loads and indexes the configured content graph', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const path = String(input)
        const data = contentResponses.get(path)
        return {
          ok: data !== undefined,
          status: data === undefined ? 404 : 200,
          statusText: data === undefined ? 'Not Found' : 'OK',
          json: async () => structuredClone(data),
        } as Response
      }),
    )

    const registry = await loadContent()

    expect(registry.courses).toHaveLength(5)
    expect(registry.catalogCourses).toHaveLength(4)
    expect(registry.catalogCourses.map(({ id }) => id)).not.toContain('runtime-showcase')
    expect(registry.lessonById).toHaveLength(13)
    expect(registry.courseById.get('runtime-showcase')?.visibility).toBe('internal')
    expect(registry.lessonById.get('primitive-showcase')?.primitives).toHaveLength(28)
    expect(registry.courseById.get('scientific-imaging')?.lessons).toHaveLength(5)
    expect(registry.assetById.get('course-imaging-cover')?.type).toBe('image')
    expect(registry.cases).toEqual([])
    expect(registry.anatomyMapById.get('lung-map')?.modelAssetId).toBe('lung-model')
    expect(registry.anatomyMaps).toHaveLength(1)
    expect(registry.warnings).toEqual([])
  })

  it('fetches, validates, and indexes cases and anatomy maps', async () => {
    const manifest = structuredClone(contentResponses.get('/content/manifest.json')) as {
      cases: string[]
      anatomyMaps: string[]
    }
    manifest.cases = ['fixtures/case.json']
    manifest.anatomyMaps = ['anatomy/lung-map.json', 'fixtures/anatomy-map.json']
    const caseBundle = withCaseFixture()
    const appConfig = caseBundle.appConfig
    const responses = new Map(contentResponses)
    responses.set('/content/manifest.json', manifest)
    responses.set('/content/app-config.json', appConfig)
    responses.set('/content/assets.json', caseBundle.assetManifest)
    responses.set('/content/fixtures/case.json', caseFixture)
    responses.set('/content/fixtures/anatomy-map.json', anatomyMapFixture)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const data = responses.get(String(input))
        return {
          ok: data !== undefined,
          status: data === undefined ? 404 : 200,
          statusText: data === undefined ? 'Not Found' : 'OK',
          json: async () => structuredClone(data),
        } as Response
      }),
    )

    const registry = await loadContent()

    expect(registry.caseById.get('case-contract-fixture')?.title).toBe('Contract fixture')
    expect(registry.anatomyMapById.get('fixture-anatomy')?.structures).toHaveLength(2)
  })

  it('validates case semantics with source files and precise JSON paths', () => {
    const bundle = withCaseFixture(invalidCaseSemantics)
    const appConfig = bundle.appConfig as {
      caseLab: { featuredCaseId: string; caseIds: string[]; dailyQuickCaseId: string }
    }
    appConfig.caseLab.featuredCaseId = 'invalid-case-semantics'
    appConfig.caseLab.caseIds = ['invalid-case-semantics']
    appConfig.caseLab.dailyQuickCaseId = 'invalid-case-semantics'

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            file: 'fixtures/case.json',
            path: 'conceptIds.0',
            message: expect.stringContaining('missing-case-concept'),
          }),
          expect.objectContaining({ path: 'patient.imageAssetId' }),
          expect.objectContaining({ path: 'entry.markerStructureId' }),
          expect.objectContaining({ path: 'clues.0.category' }),
          expect.objectContaining({ path: 'clues.0.primitive.conceptIds.0' }),
          expect.objectContaining({ path: 'clues.0.primitive.assets.0' }),
          expect.objectContaining({ path: 'stages.0.clueIds.0' }),
          expect.objectContaining({ path: 'stages.0.steps.0.id' }),
          expect.objectContaining({ path: 'stages.0.steps.0.clueIds.0' }),
          expect.objectContaining({ path: 'stages.0.steps.0.conceptIds.0' }),
          expect.objectContaining({ path: 'stages.0.steps.0.assets.0' }),
          expect.objectContaining({ path: 'stages.1.id' }),
          expect.objectContaining({ path: 'stages.1.kind' }),
          expect.objectContaining({ path: 'expertBenchmark.openedClueIds.0' }),
          expect.objectContaining({ path: 'expertBenchmark.responses.missing-step' }),
          expect.objectContaining({ path: 'debrief.keyClueIds.0' }),
        ]),
      }),
    )
  })

  it('rejects clue references anywhere outside case content', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles[0]!.data as {
      lessons: Array<{ primitives: Array<Record<string, unknown>> }>
    }
    course.lessons[0]!.primitives[0]!.clueIds = ['case-only-clue']

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            file: bundle.courseFiles[0]!.file,
            path: 'lessons.0.primitives.0.clueIds.0',
            message: 'clueIds may only be used in case content.',
          }),
        ]),
      }),
    )
  })

  it('resolves nested response clue references within a case', () => {
    const caseDocument = structuredClone(caseFixture) as {
      stages: Array<{
        steps: Array<{
          content: { options?: Array<{ clueIds?: string[] }> }
        }>
      }>
    }
    caseDocument.stages[0]!.steps[0]!.content.options![1]!.clueIds = ['missing-response-clue']

    expect(() => validateContentBundle(withCaseFixture(caseDocument))).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            file: 'fixtures/case.json',
            path: 'stages.0.steps.0.content.options.1.clueIds.0',
            message: expect.stringContaining('missing-response-clue'),
          }),
        ]),
      }),
    )
  })

  it('validates case-lab IDs and available anatomy entry references', () => {
    const bundle = withCaseFixture()
    const appConfig = bundle.appConfig as {
      caseLab: { featuredCaseId: string; caseIds: string[] }
    }
    appConfig.caseLab.featuredCaseId = 'missing-case'
    appConfig.caseLab.caseIds.push('missing-case')
    const caseDocument = bundle.caseFiles[0]!.data as {
      entry: { mode: string; waypointId?: string }
    }
    caseDocument.entry = { mode: 'endoscopic', waypointId: 'missing-waypoint' }

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'caseLab.featuredCaseId',
            message: expect.stringContaining('Unknown case reference'),
          }),
          expect.objectContaining({
            path: 'caseLab.caseIds.1',
            message: expect.stringContaining('Unknown case reference'),
          }),
          expect.objectContaining({
            path: 'entry.waypointId',
            message: expect.stringContaining('Unknown anatomy waypoint reference'),
          }),
        ]),
      }),
    )
  })

  it('validates anatomy hierarchy, mesh bindings, and waypoint graphs', () => {
    const bundle = withCaseFixture()
    const anatomyMap = bundle.anatomyMapFiles.find(
      ({ file }) => file === 'fixtures/anatomy-map.json',
    )!.data as {
      levels: Array<{ id: string; label: string }>
      structures: Array<{
        id: string
        levelId: string
        parentId?: string
        label: string
        meshNames: string[]
      }>
      waypoints: Array<{
        id: string
        label: string
        position: [number, number, number]
        lookAt: [number, number, number]
        next: string[]
      }>
    }
    anatomyMap.levels.push({ id: 'region', label: 'Duplicate region' })
    anatomyMap.structures[1]!.parentId = 'target-structure'
    anatomyMap.structures[1]!.meshNames = ['missing-mesh']
    anatomyMap.structures.push({
      id: 'orphan-structure',
      levelId: 'structure',
      parentId: 'missing-parent',
      label: 'Orphan',
      meshNames: ['root-region'],
    })
    anatomyMap.waypoints[0]!.next = ['entry-waypoint', 'missing-waypoint']
    anatomyMap.waypoints.push(structuredClone(anatomyMap.waypoints[0]!))

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({ path: 'levels.2.id' }),
          expect.objectContaining({
            path: 'structures.1.parentId',
            message: expect.stringContaining('prior anatomy level'),
          }),
          expect.objectContaining({ path: 'structures.1.meshNames.0' }),
          expect.objectContaining({
            path: 'structures.2.parentId',
            message: expect.stringContaining('missing-parent'),
          }),
          expect.objectContaining({ path: 'waypoints.2.id' }),
          expect.objectContaining({ path: 'waypoints.0.next.1' }),
          expect.objectContaining({
            path: 'waypoints',
            message: expect.stringContaining('acyclic'),
          }),
        ]),
      }),
    )
  })

  it('requires anatomy maps to reference model assets', () => {
    const bundle = withCaseFixture()
    const assetManifest = bundle.assetManifest as {
      assets: Array<Record<string, unknown>>
    }
    const modelIndex = assetManifest.assets.findIndex(
      ({ assetId }) => assetId === 'fixture-anatomy-model',
    )
    assetManifest.assets[modelIndex] = {
      assetId: 'fixture-anatomy-model',
      path: '/assets/models/not-a-model.svg',
      type: 'image',
      mimeType: 'image/svg+xml',
      offlineRequired: false,
      offlineAvailable: false,
      sizeBytes: 1024,
      sha256: '1'.repeat(64),
    }

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'modelAssetId',
            message: expect.stringContaining('expects type "model"'),
          }),
        ]),
      }),
    )
  })

  it('reports unknown references with their source path', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles[0]?.data as { conceptIds: string[] }
    course.conceptIds = ['missing-concept']

    expect(() => validateContentBundle(bundle)).toThrow(ContentValidationError)

    try {
      validateContentBundle(bundle)
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError)
      const validationError = error as ContentValidationError
      expect(validationError.issues).toContainEqual(
        expect.objectContaining({
          file: 'courses/scientific-imaging.json',
          path: 'conceptIds.0',
          message: 'Unknown concept reference "missing-concept".',
        }),
      )
    }
  })

  it('surfaces unknown primitives as loader warnings', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles[0]?.data as {
      lessons: Array<{ primitives: unknown[] }>
    }
    const primitiveIndex = course.lessons[0]?.primitives.length ?? 0
    course.lessons[0]?.primitives.push(structuredClone(unknownPrimitive))

    const registry = validateContentBundle(bundle)

    expect(registry.warnings).toHaveLength(1)
    expect(registry.warnings[0]).toEqual(
      expect.objectContaining({
        path: `lessons.0.primitives.${primitiveIndex}.type`,
        severity: 'warning',
      }),
    )
  })

  it('rejects missing course image assets', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles[0]?.data as { imageAssetId: string }
    course.imageAssetId = 'missing-cover'

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'imageAssetId',
            message: expect.stringContaining('missing-cover'),
          }),
        ]),
      }),
    )
  })

  it('strictly validates challenge items with their full source path', () => {
    const bundle = makeValidContentBundle()
    const appConfig = bundle.appConfig as {
      challenges: Array<{ items: unknown[] }>
    }
    appConfig.challenges[0]!.items[0] = structuredClone(invalidChallengePrimitive)

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            file: 'app-config.json',
            path: 'challenges.0.items.0.content.options',
          }),
          expect.objectContaining({
            file: 'app-config.json',
            path: 'challenges.0.items.0.content',
          }),
        ]),
      }),
    )
  })

  it('preserves precise challenge paths for semantic schema failures', () => {
    const bundle = makeValidContentBundle()
    const appConfig = bundle.appConfig as {
      challenges: Array<{ items: unknown[] }>
    }
    appConfig.challenges[0]!.items[0] = {
      id: 'semantic-errors',
      type: 'multiple_select',
      conceptIds: ['thoracic-imaging'],
      content: {
        prompt: 'Select supported findings.',
        options: [
          { id: 'duplicate', label: 'First' },
          { id: 'duplicate', label: 'Second' },
        ],
        correctOptionIds: ['missing', 'missing'],
        scoringMode: 'partial',
        minSelections: 3,
        explanation: 'Fixture explanation.',
      },
      assets: [],
      completion: { mode: 'answer' },
      scoring: { weight: 1 },
      feedback: {},
    }

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          {
            file: 'app-config.json',
            path: 'challenges.0.items.0.content.options',
            message: 'option IDs must be unique',
            severity: 'error',
          },
          {
            file: 'app-config.json',
            path: 'challenges.0.items.0.content.correctOptionIds',
            message: 'correctOptionIds must be unique',
            severity: 'error',
          },
          {
            file: 'app-config.json',
            path: 'challenges.0.items.0.content.correctOptionIds',
            message: 'correctOptionIds must reference options',
            severity: 'error',
          },
          {
            file: 'app-config.json',
            path: 'challenges.0.items.0.content.minSelections',
            message: 'minSelections cannot exceed the number of correct options',
            severity: 'error',
          },
        ]),
      }),
    )
  })

  it('validates challenge concept, reward and asset references', () => {
    const bundle = makeValidContentBundle()
    const appConfig = bundle.appConfig as {
      challenges: Array<{ items: unknown[] }>
    }
    appConfig.challenges[0]!.items[0] = {
      id: 'invalid-references',
      type: 'image',
      conceptIds: ['missing-concept'],
      content: { assetId: 'missing-content-asset', alt: 'Missing fixture' },
      assets: ['missing-declared-asset'],
      completion: { mode: 'viewed' },
      scoring: {},
      feedback: {},
      reward: { type: 'badge', id: 'missing-badge' },
    }

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'challenges.0.items.0.conceptIds.0',
            message: expect.stringContaining('missing-concept'),
          }),
          expect.objectContaining({
            path: 'challenges.0.items.0.reward.id',
            message: expect.stringContaining('missing-badge'),
          }),
          expect.objectContaining({
            path: 'challenges.0.items.0.assets.0',
            message: expect.stringContaining('missing-declared-asset'),
          }),
          expect.objectContaining({
            path: 'challenges.0.items.0.content.assetId',
            message: expect.stringContaining('missing-content-asset'),
          }),
        ]),
      }),
    )
  })

  it('rejects duplicate primitive ids within lessons and challenges', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles[0]?.data as {
      lessons: Array<{ primitives: unknown[] }>
    }
    const appConfig = bundle.appConfig as {
      challenges: Array<{ items: unknown[] }>
    }
    course.lessons[0]!.primitives.push(structuredClone(course.lessons[0]!.primitives[0]))
    appConfig.challenges[0]!.items.push(structuredClone(appConfig.challenges[0]!.items[0]))

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'lessons.0.primitives.1.id',
            message: expect.stringContaining('Duplicate primitive id'),
          }),
          expect.objectContaining({
            path: 'challenges.0.items.5.id',
            message: expect.stringContaining('Duplicate primitive id'),
          }),
        ]),
      }),
    )
  })

  it('checks content asset references against their expected manifest type', () => {
    const bundle = makeValidContentBundle()
    const assetManifest = bundle.assetManifest as {
      assets: Array<{ assetId: string; type: string }>
    }
    const asset = assetManifest.assets.find(({ assetId }) => assetId === 'windowing-diagram')
    if (!asset) throw new Error('Expected windowing fixture asset')
    asset.type = 'video'

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'lessons.1.primitives.0.content.assetId',
            message: expect.stringContaining('expects type "image"'),
          }),
        ]),
      }),
    )
  })

  it('validates scenario graphs and typed context assets through the content layer', () => {
    const brokenGraphBundle = makeValidContentBundle()
    const imagingCourse = brokenGraphBundle.courseFiles[0]?.data as {
      lessons: Array<{
        primitives: Array<{
          content: { nodes: Array<{ id: string; next?: string }> }
        }>
      }>
    }
    const scenario = imagingCourse.lessons
      .flatMap(({ primitives }) => primitives)
      .find((primitive) => primitive.content.nodes?.some(({ id }) => id === 'case-context'))
    const context = scenario?.content.nodes.find(({ id }) => id === 'case-context')
    if (!context) throw new Error('Expected scenario context fixture')
    context.next = 'missing-decision'

    expect(() => validateContentBundle(brokenGraphBundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining('content.nodes.0.next'),
            message: expect.stringContaining('does not exist'),
          }),
        ]),
      }),
    )

    const wrongAssetBundle = makeValidContentBundle()
    const assetManifest = wrongAssetBundle.assetManifest as {
      assets: Array<{ assetId: string; type: string }>
    }
    const asset = assetManifest.assets.find(({ assetId }) => assetId === 'thorax-diagram')
    if (!asset) throw new Error('Expected scenario asset fixture')
    asset.type = 'video'

    expect(() => validateContentBundle(wrongAssetBundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: expect.stringContaining('content.nodes.0.asset.assetId'),
            message: expect.stringContaining('expects type "image"'),
          }),
        ]),
      }),
    )
  })

  it('rejects timers on incompatible registered primitive types', () => {
    const bundle = makeValidContentBundle()
    const course = bundle.courseFiles[0]?.data as {
      lessons: Array<{ primitives: Array<{ timer?: unknown }> }>
    }
    course.lessons[0]!.primitives[0]!.timer = {
      durationSeconds: 30,
      mode: 'countdown',
    }

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'lessons.0.primitives.0.timer',
            message: expect.stringContaining('does not support timers'),
          }),
        ]),
      }),
    )
  })

  it('accepts timers on compatible registered primitive types', () => {
    const bundle = makeValidContentBundle()
    const appConfig = bundle.appConfig as {
      challenges: Array<{ items: Array<{ timer?: unknown }> }>
    }
    appConfig.challenges[0]!.items[0]!.timer = {
      durationSeconds: 30,
      mode: 'countdown',
    }

    expect(() => validateContentBundle(bundle)).not.toThrow()
  })

  it('surfaces challenge primitive semantic warnings', () => {
    const bundle = makeValidContentBundle()
    const appConfig = bundle.appConfig as {
      challenges: Array<{ items: unknown[] }>
    }
    appConfig.challenges[0]!.items.push(structuredClone(unknownPrimitive))

    const registry = validateContentBundle(bundle)

    expect(registry.warnings).toContainEqual(
      expect.objectContaining({
        file: 'app-config.json',
        path: 'challenges.0.items.5.type',
        message: expect.stringContaining('runtime fallback'),
      }),
    )
  })

  it('rejects cyclic pathway graphs', () => {
    const bundle = makeValidContentBundle()
    const appConfig = bundle.appConfig as {
      pathways: Array<{ edges: Array<{ from: string; to: string }> }>
    }
    appConfig.pathways[0]?.edges.push({ from: 'node-challenge', to: 'node-intro' })

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringContaining('acyclic') }),
        ]),
      }),
    )
  })

  it('rejects unknown achievement criterion references', () => {
    const bundle = makeValidContentBundle()
    const appConfig = bundle.appConfig as {
      badges: Array<{
        criteria: {
          type: string
          count: number
          lessonIds?: string[]
        }
      }>
    }
    appConfig.badges[0]!.criteria = {
      type: 'lessons_completed',
      count: 1,
      lessonIds: ['missing-lesson'],
    }

    expect(() => validateContentBundle(bundle)).toThrow(
      expect.objectContaining({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: 'badges.0.criteria.lessonIds.0',
            message: expect.stringContaining('Unknown lesson reference'),
          }),
        ]),
      }),
    )
  })
})
