import type { ZodType } from 'zod'

import type { Primitive } from '../primitiveBase'

export type PrimitiveAssetType = 'image' | 'video' | 'audio' | 'document'

export interface PrimitiveAssetRef {
  assetId: string
  type: PrimitiveAssetType
}

export interface PrimitiveContentSchema<P extends Primitive> {
  schema: ZodType<P>
  assetRefs: (primitive: P) => PrimitiveAssetRef[]
}
