import invalidCourse from '../../public/content/fixtures/invalid-course.json'
import unknownPrimitive from '../../public/content/fixtures/unknown-primitive.json'
import advancedSeed from '../../public/content/seeds/advanced.json'
import { describe, expect, it, vi } from 'vitest'

import {
  ContentValidationError,
  loadContent,
  validateContentBundle,
} from '@/content/loader'
import { courseSchema, learnerSeedSchema, parsePrimitive } from '@/content/schema'
import { contentResponses, makeValidContentBundle } from '@/test/contentFixtures'

describe('content schemas', () => {
  it('accepts the advanced learner seed', () => {
    expect(learnerSeedSchema.parse(advancedSeed).learner.name).toBe('Maya Chen')
  })

  it('rejects the invalid course with useful paths', () => {
    const result = courseSchema.safeParse(invalidCourse)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain('title')
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toContain(
        'estimatedMinutes',
      )
    }
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

    expect(registry.courses).toHaveLength(4)
    expect(registry.lessonById).toHaveLength(12)
    expect(registry.courseById.get('scientific-imaging')?.lessons).toHaveLength(5)
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
          path: 'conceptIds',
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
})
