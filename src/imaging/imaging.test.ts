import { describe, expect, it } from 'vitest'

import { validateContentBundle } from '@/content/loader'
import type {
  DicomExplorePrimitive,
  DicomGuidedPrimitive,
  DicomIdentifyRegionPrimitive,
  DicomMeasurePrimitive,
} from '@/content/schema/primitives'
import {
  evaluateDicomExplore,
  evaluateDicomMeasurement,
  evaluateDicomRegion,
  evaluateGuidedCheckpoint,
} from '@/imaging/evaluation'
import { normalizedLineLengthMm, pointInRegion } from '@/imaging/geometry'
import {
  exploreRequirementKeys,
  firstIncompleteGuidedStep,
  satisfiedExploreRequirements,
} from '@/imaging/requirements'
import {
  assertManifestMatchesAsset,
  dicomSeriesManifestSchema,
  type DicomAsset,
} from '@/imaging/series'
import { resolveDicomUrl } from '@/imaging/seriesUrl'
import { makeValidContentBundle } from '@/test/contentFixtures'

const registry = validateContentBundle(makeValidContentBundle())
const imagingLesson = registry.lessonById.get('dicom-lab')!
const explore = registry.lessonById
  .get('thoracic-ct')!
  .primitives.find(({ type }) => type === 'dicom_explore') as DicomExplorePrimitive
const guided = imagingLesson.primitives.find(
  ({ type }) => type === 'dicom_guided',
) as DicomGuidedPrimitive
const identify = imagingLesson.primitives.find(
  ({ type }) => type === 'dicom_identify_region',
) as DicomIdentifyRegionPrimitive
const measure = imagingLesson.primitives.find(
  ({ type }) => type === 'dicom_measure',
) as DicomMeasurePrimitive
const assetEntry = registry.assetById.get('thoracic-ct-series')!
if (assetEntry.type !== 'dicom' || !assetEntry.series) throw new Error('Missing DICOM test asset')
const asset = assetEntry as DicomAsset

describe('DICOM pure domain', () => {
  it('resolves relative series paths against local and external bases', () => {
    expect(resolveDicomUrl('thoracic-ct/manifest.json').pathname).toBe(
      '/assets/dicom/thoracic-ct/manifest.json',
    )
    expect(
      resolveDicomUrl('thoracic-ct/manifest.json', 'https://cdn.example.test/medical/').href,
    ).toBe('https://cdn.example.test/medical/thoracic-ct/manifest.json')
  })

  it('validates hosted manifest geometry against the content asset', () => {
    const manifest = dicomSeriesManifestSchema.parse({
      schemaVersion: '0.2',
      seriesId: 'thoracic-ct',
      description: 'Fixture',
      modality: 'CT',
      transferSyntaxUid: '1.2.840.10008.1.2.1',
      sourceFileCount: 1,
      sliceCount: 125,
      totalBytes: 100,
      geometry: {
        rows: 512,
        columns: 512,
        pixelSpacingMm: [0.976562, 0.976562],
        sliceThicknessMm: 3.75,
      },
      files: [{ path: 'files/0001.dcm', sizeBytes: 100, sha256: 'a'.repeat(64) }],
      presets: [{ id: 'soft', label: 'Soft', center: 40, width: 400 }],
      attribution: { collection: 'Public', license: 'CC BY', doi: '10.test/example' },
    })
    expect(() => assertManifestMatchesAsset(manifest, asset)).not.toThrow()
    expect(() =>
      assertManifestMatchesAsset(
        { ...manifest, geometry: { ...manifest.geometry, rows: 256 } },
        asset,
      ),
    ).toThrow(/geometry/u)
  })

  it('tracks exploration and ordered guidance conditions', () => {
    const observation = {
      slice: 81,
      presetId: 'mediastinal',
      activeTool: 'scroll',
      interactionCount: 3,
      acknowledgedStepIds: new Set<string>(),
    }
    expect(exploreRequirementKeys(explore)).toEqual([
      'interactions',
      'preset:lung',
      'preset:mediastinal',
    ])
    expect(satisfiedExploreRequirements(explore, observation)).toEqual([
      'interactions',
      'preset:mediastinal',
    ])
    expect(
      satisfiedExploreRequirements(explore, {
        ...observation,
        visitedPresetIds: new Set(['lung', 'mediastinal']),
      }),
    ).toEqual(['interactions', 'preset:lung', 'preset:mediastinal'])
    expect(
      evaluateDicomExplore(explore, {
        slice: 81,
        presetId: 'mediastinal',
        activeTool: 'scroll',
        interactionCount: 3,
        visitedPresetIds: ['lung', 'mediastinal'],
      }),
    ).toMatchObject({ score: 1, correct: true })
    expect(
      evaluateDicomExplore(explore, {
        slice: 81,
        presetId: 'lung',
        activeTool: 'scroll',
        interactionCount: 1,
      }),
    ).toMatchObject({ score: 1 / 3, correct: false })
    expect(firstIncompleteGuidedStep(guided, observation)).toBe(2)
  })

  it('grades slice-aware regions and calibrated measurements fractionally', () => {
    expect(pointInRegion({ x: 0.5009, y: 0.4668 }, identify.content.target.region)).toBe(true)
    expect(
      evaluateDicomRegion(identify, { slice: 81, point: { x: 0.5009, y: 0.4668 } }),
    ).toMatchObject({ score: 1, correct: true })
    expect(
      evaluateDicomRegion(identify, { slice: 20, point: { x: 0.5009, y: 0.4668 } }),
    ).toMatchObject({ score: 0.5, correct: false })
    expect(evaluateDicomMeasurement(measure, { slice: 81, value: 17.7, unit: 'mm' })).toMatchObject(
      { score: 1, correct: true },
    )
    expect(evaluateDicomMeasurement(measure, { slice: 81, value: 17.7, unit: 'px' })).toMatchObject(
      { score: 0, correct: false },
    )
  })

  it('matches reference-line geometry and evaluates guided checkpoints', () => {
    const line = measure.content.target.referenceLine!
    expect(normalizedLineLengthMm(line, asset.series)).toBeCloseTo(17.578, 2)
    expect(evaluateGuidedCheckpoint(guided, 'trachea')).toMatchObject({
      score: 1,
      correct: true,
    })
  })
})
