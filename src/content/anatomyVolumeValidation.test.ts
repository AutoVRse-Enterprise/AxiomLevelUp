import { describe, expect, it } from 'vitest'

import {
  ellipsoidFitsInside,
  ellipsoidFitsModelBounds,
  ellipsoidOverlapRatio,
  validateAnatomyVolumes,
} from '@/content/anatomyVolumeValidation'
import type { AnatomyStructure, AnatomyVolumeStructure } from '@/content/schema/anatomyMap'

type Ellipsoid = AnatomyVolumeStructure['volume']

const ellipsoid = (
  center: [number, number, number],
  radii: [number, number, number],
  rotation?: [number, number, number],
): Ellipsoid => ({
  shape: 'ellipsoid',
  center,
  radii,
  ...(rotation ? { rotation } : {}),
})

describe('anatomy volume geometry', () => {
  it('measures center-line overlap independently of axis scale', () => {
    expect(
      ellipsoidOverlapRatio(ellipsoid([0, 0, 0], [2, 1, 1]), ellipsoid([4, 0, 0], [2, 1, 1])),
    ).toBe(0)
    expect(
      ellipsoidOverlapRatio(ellipsoid([0, 0, 0], [2, 1, 1]), ellipsoid([3, 0, 0], [2, 1, 1])),
    ).toBeCloseTo(0.5)
  })

  it('checks tolerant containment with rotated child extremes', () => {
    const parent = ellipsoid([0, 0, 0], [5, 5, 5])
    expect(
      ellipsoidFitsInside(ellipsoid([0, 0, 0], [2, 1, 1], [0, 0, Math.PI / 4]), parent, 0),
    ).toBe(true)
    expect(ellipsoidFitsInside(ellipsoid([4.5, 0, 0], [1, 1, 1]), parent, 0)).toBe(false)
    expect(ellipsoidFitsInside(ellipsoid([4.5, 0, 0], [1, 1, 1]), parent, 0.1)).toBe(true)
  })

  it('checks rotated ellipsoid extents against configured model bounds', () => {
    const bounds = { min: [-5, -5, -5] as const, max: [5, 5, 5] as const }
    expect(ellipsoidFitsModelBounds(ellipsoid([0, 0, 0], [2, 3, 4], [0, 0.2, 0]), bounds, 0)).toBe(
      true,
    )
    expect(ellipsoidFitsModelBounds(ellipsoid([4.8, 0, 0], [1, 1, 1]), bounds, 0)).toBe(false)
  })

  it('reports unresolved parents, ancestor overflow and excessive same-level overlap', () => {
    const structures = [
      {
        id: 'root',
        levelId: 'system',
        label: 'Root',
        meshNames: ['root'],
      },
      {
        id: 'volume-parent',
        levelId: 'lobe',
        parentId: 'root',
        label: 'Volume parent',
        volume: ellipsoid([0, 0, 0], [5, 5, 5]),
      },
      {
        id: 'inside',
        levelId: 'segment',
        parentId: 'volume-parent',
        label: 'Inside',
        volume: ellipsoid([0, 0, 0], [2, 2, 2]),
      },
      {
        id: 'outside',
        levelId: 'segment',
        parentId: 'volume-parent',
        label: 'Outside',
        volume: ellipsoid([4.5, 0, 0], [2, 2, 2]),
      },
      {
        id: 'overlap',
        levelId: 'segment',
        parentId: 'volume-parent',
        label: 'Overlap',
        volume: ellipsoid([1, 0, 0], [2, 2, 2]),
      },
      {
        id: 'orphan',
        levelId: 'segment',
        parentId: 'missing',
        label: 'Orphan',
        volume: ellipsoid([0, 0, 0], [1, 1, 1]),
      },
    ] satisfies AnatomyStructure[]

    expect(
      validateAnatomyVolumes(
        structures,
        { min: [-10, -10, -10], max: [10, 10, 10] },
        { ancestorFitTolerance: 0, sameLevelOverlapTolerance: 0.2 },
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ structureIndex: 3, message: expect.stringContaining('fit') }),
        expect.objectContaining({
          structureIndex: 4,
          message: expect.stringContaining('overlaps'),
        }),
        expect.objectContaining({ structureIndex: 5, field: 'parentId' }),
      ]),
    )
  })
})
