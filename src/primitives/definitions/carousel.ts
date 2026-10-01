import { timerCompatibleTypeSet } from '@/content/primitiveTypes'
import type { CarouselPrimitive } from '@/content/schema/primitives'
import { definePrimitive } from '@/primitives/definitions/types'

export const carouselDefinition = definePrimitive<CarouselPrimitive>({
  type: 'carousel',
  family: 'content',
  label: 'Carousel',
  layout: 'stacked',
  timerCompatible: timerCompatibleTypeSet.has('carousel'),
  scored: () => false,
  reviewPrompt: (primitive) => primitive.content.title,
  explorableKeys: (primitive) => primitive.content.slides.map(({ id }) => id),
})
