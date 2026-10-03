import { describe, expect, it } from 'vitest'

import type { AnatomyMap } from '@/content/schema/anatomyMap'
import { resolveStructure } from '@/anatomy3d/viewer/resolveStructure'

type AnatomyStructure = AnatomyMap['structures'][number]

const structures = [
  {
    id: 'respiratory-system',
    levelId: 'system',
    label: 'Respiratory system',
    meshNames: ['right-upper-lobe-mesh', 'right-lower-lobe-mesh', 'trachea-mesh'],
  },
  {
    id: 'right-upper-lobe',
    levelId: 'lobe',
    parentId: 'respiratory-system',
    label: 'Right upper lobe',
    meshNames: ['right-upper-lobe-mesh'],
  },
  {
    id: 'right-lower-lobe',
    levelId: 'lobe',
    parentId: 'respiratory-system',
    label: 'Right lower lobe',
    meshNames: ['right-lower-lobe-mesh'],
  },
  {
    id: 'trachea',
    levelId: 'structure',
    parentId: 'respiratory-system',
    label: 'Trachea',
    meshNames: ['trachea-mesh'],
  },
] satisfies AnatomyStructure[]

describe('resolveStructure', () => {
  it('resolves an aggregate mesh binding to its deepest eligible descendant', () => {
    expect(resolveStructure(['right-lower-lobe-mesh'], structures)).toBe('right-lower-lobe')
    expect(resolveStructure(['right-lower-lobe-mesh'], structures, ['system'])).toBe(
      'respiratory-system',
    )
    expect(resolveStructure(['right-lower-lobe-mesh'], structures, ['lobe'])).toBe(
      'right-lower-lobe',
    )
  })

  it('honors raycast hit order before considering farther structures', () => {
    expect(
      resolveStructure(['right-upper-lobe-mesh', 'right-lower-lobe-mesh'], structures, ['lobe']),
    ).toBe('right-upper-lobe')
  })

  it('prefers fewer mesh bindings when ancestry depth is equal', () => {
    const overlapping = [
      ...structures,
      {
        id: 'broad-lobe-region',
        levelId: 'lobe',
        parentId: 'respiratory-system',
        label: 'Broad lobe region',
        meshNames: ['right-upper-lobe-mesh', 'right-lower-lobe-mesh'],
      },
    ] satisfies AnatomyStructure[]

    expect(resolveStructure(['right-upper-lobe-mesh'], overlapping, ['lobe'])).toBe(
      'right-upper-lobe',
    )
  })

  it('uses structure ID as a deterministic final tie-break', () => {
    const tied = [
      {
        id: 'zeta',
        levelId: 'lobe',
        label: 'Zeta',
        meshNames: ['shared-mesh'],
      },
      {
        id: 'alpha',
        levelId: 'lobe',
        label: 'Alpha',
        meshNames: ['shared-mesh'],
      },
    ] satisfies AnatomyStructure[]

    expect(resolveStructure(['shared-mesh'], tied, ['lobe'])).toBe('alpha')
    expect(resolveStructure(['shared-mesh'], [...tied].reverse(), ['lobe'])).toBe('alpha')
  })

  it('returns null when no hit is selectable', () => {
    expect(resolveStructure(['missing-mesh'], structures)).toBeNull()
    expect(resolveStructure(['right-lower-lobe-mesh'], structures, [])).toBeNull()
    expect(resolveStructure(['right-lower-lobe-mesh'], structures, ['segment'])).toBeNull()
  })

  it('resolves a direct procedural-volume hit within the selectable level', () => {
    const withVolume = [
      ...structures,
      {
        id: 'right-lower-posterior-basal-segment',
        levelId: 'segment',
        parentId: 'right-lower-lobe',
        label: 'Posterior basal segment',
        volume: {
          shape: 'ellipsoid',
          center: [-68, -150, 1105],
          radii: [25, 24, 35],
        },
      },
    ] satisfies AnatomyStructure[]

    expect(
      resolveStructure([], withVolume, ['segment'], ['right-lower-posterior-basal-segment']),
    ).toBe('right-lower-posterior-basal-segment')
    expect(
      resolveStructure([], withVolume, ['lobe'], ['right-lower-posterior-basal-segment']),
    ).toBeNull()
  })
})
