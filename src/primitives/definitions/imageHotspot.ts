import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { ImageHotspotPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'
import { hitImageRegions, isNormalizedPoint } from '@/primitives/definitions/imageHitTesting'

export const imageHotspotDefinition = definePrimitive<ImageHotspotPrimitive>({
  type: 'image_hotspot',
  family: (primitive) => (primitive.content.mode === 'assess' ? 'assessment' : 'content'),
  label: 'Image hotspot',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('image_hotspot'),
  scored: (primitive) => primitive.content.mode === 'assess',
  evaluate: (primitive, response) => {
    if (primitive.content.mode !== 'assess') {
      return { score: 0, correct: false, explanation: null }
    }

    const targetRegionIds = primitive.content.targetRegionIds
    const correct =
      isNormalizedPoint(response) &&
      hitImageRegions(response, primitive.content.regions).some((region) =>
        targetRegionIds.includes(region.id),
      )
    return {
      score: Number(correct),
      correct,
      explanation: primitive.content.explanation,
      items: { location: correct ? 'correct' : 'incorrect' },
    }
  },
  reviewPrompt: (primitive) =>
    primitive.content.prompt ?? primitive.content.caption ?? primitive.content.alt,
  explorableKeys: (primitive) =>
    primitive.content.mode === 'explore' ? primitive.content.regions.map(({ id }) => id) : [],
})
