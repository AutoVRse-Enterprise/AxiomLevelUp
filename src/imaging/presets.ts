import type { z } from 'zod'

import type { dicomPresetSchema } from '@/content/schema/primitives'

export type DicomPreset = z.infer<typeof dicomPresetSchema>

export function presetVoiRange(preset: DicomPreset) {
  return {
    lower: preset.center - preset.width / 2,
    upper: preset.center + preset.width / 2,
  }
}
