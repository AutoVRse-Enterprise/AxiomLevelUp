import type { ZodType } from 'zod'

import type { Primitive } from '../primitiveBase'

export type PrimitiveAssetType = 'image' | 'video' | 'audio' | 'dicom' | 'document' | 'text'

export interface PrimitiveAssetRef {
  assetId: string
  type: PrimitiveAssetType
  path: string
}

export interface PrimitiveContentSchema<P extends Primitive> {
  schema: ZodType<P>
  assetRefs: (primitive: P) => PrimitiveAssetRef[]
}
