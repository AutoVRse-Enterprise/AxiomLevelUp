import invalidChallengePrimitive from '../../public/content/fixtures/invalid-challenge-primitive.json'
import invalidCourse from '../../public/content/fixtures/invalid-course.json'
import unknownPrimitive from '../../public/content/fixtures/unknown-primitive.json'
import advancedSeed from '../../public/content/seeds/advanced.json'
import { describe, expect, it, vi } from 'vitest'

import { ContentValidationError, loadContent, validateContentBundle } from '@/content/loader'
import {
  assetManifestSchema,
  courseSchema,
  learnerSeedSchema,
  parsePrimitive,
} from '@/content/schema'
import { contentResponses, makeValidContentBundle } from '@/test/contentFixtures'

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

  it('keeps an unknown primitive as a warning', () => {
    const result = parsePrimitive(unknownPrimitive)

    expect(result.issues).toEqual([])
    expect(result.primitive?.type).toBe('future_lab_simulation')
    expect(result.warnings[0]).toContain('runtime fallback')
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
    expect(registry.lessonById.get('primitive-showcase')?.primitives).toHaveLength(25)
    expect(registry.courseById.get('scientific-imaging')?.lessons).toHaveLength(5)
    expect(registry.assetById.get('course-imaging-cover')?.type).toBe('image')
    expect(registry.warnings).toEqual([])
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
