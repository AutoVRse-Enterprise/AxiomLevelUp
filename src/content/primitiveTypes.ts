export const contentPrimitiveTypes = [
  'rich_text',
  'image',
  'zoomable_image',
  'image_hotspot',
  'image_compare',
  'video',
  'audio',
  'carousel',
  'data_table',
  'chart',
  'formula',
  'pdf_reference',
] as const

export const assessmentPrimitiveTypes = [
  'multiple_choice',
  'multiple_select',
  'true_false',
  'classification',
  'match_pairs',
  'ordering',
  'fill_blank',
  'numeric',
] as const

export const timerCompatibleTypes = assessmentPrimitiveTypes

export const dicomPrimitiveTypes = [
  'dicom_explore',
  'dicom_guided',
  'dicom_identify_region',
  'dicom_measure',
] as const

export const domainPrimitiveTypes = ['scenario', ...dicomPrimitiveTypes] as const

export const primitiveTypes = [
  ...contentPrimitiveTypes,
  ...assessmentPrimitiveTypes,
  ...domainPrimitiveTypes,
] as const

export type PrimitiveType = (typeof primitiveTypes)[number]

export const primitiveTypeSet: ReadonlySet<string> = new Set(primitiveTypes)
export const dicomPrimitiveTypeSet: ReadonlySet<string> = new Set(dicomPrimitiveTypes)
export const timerCompatibleTypeSet: ReadonlySet<string> = new Set(timerCompatibleTypes)
