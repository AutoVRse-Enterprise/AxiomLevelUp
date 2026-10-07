import defaultAssetsDocument from '../../public/content/assets.json'
import gameMapDocument from '../../public/experiences/sanofi/content/anatomy/respiratory-game-map.json'
import sanofiAssetsDocument from '../../public/experiences/sanofi/content/assets.json'
import { describe, expect, it } from 'vitest'

import { anatomyMapSchema, assetManifestSchema } from '@/content/schema'

describe('respiratory game anatomy map', () => {
  const map = anatomyMapSchema.parse(gameMapDocument)
  const defaultAssets = assetManifestSchema.parse(defaultAssetsDocument)
  const sanofiAssets = assetManifestSchema.parse(sanofiAssetsDocument)

  it('reuses the verified lung model contract', () => {
    const expected = defaultAssets.assets.find(({ assetId }) => assetId === 'lung-model')
    const actual = sanofiAssets.assets.find(({ assetId }) => assetId === 'lung-model')
    expect(actual).toEqual(expected)
    expect(map.modelAssetId).toBe('lung-model')
  })

  it('keeps every answer dimension coherent', () => {
    const structures = new Map(map.structures.map((structure) => [structure.id, structure]))
    for (const waypoint of map.waypoints) {
      const answers = waypoint.answerIds
      expect(answers?.side).toBeTruthy()
      expect(answers?.region).toBeTruthy()
      expect(answers?.['airway-level']).toBeTruthy()
      if (answers?.region === 'region-middle') expect(answers.side).toBe('right-lung')
      if (answers?.side === 'midline-airway') {
        expect(answers.region).toBe('region-central')
      }
      if (answers?.segment) {
        expect(structures.get(answers.segment)?.parentId).toBe(answers.lobe)
      }
    }
  })
})
