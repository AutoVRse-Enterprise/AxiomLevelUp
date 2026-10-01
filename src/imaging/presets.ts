import type { DicomPresetContent } from '@/content/schema/primitives'

export type DicomPreset = DicomPresetContent

export function presetVoiRange(preset: DicomPreset) {
  return {
    lower: preset.center - preset.width / 2,
    upper: preset.center + preset.width / 2,
  }
}
