export interface DicomPreset {
  id: string
  label: string
  center: number
  width: number
}

export interface DicomSeriesManifest {
  schemaVersion: '0.1'
  seriesId: string
  description: string
  sourceFileCount: number
  sliceCount: number
  totalBytes: number
  imageIds: string[]
  presets: DicomPreset[]
  sourceDirectory: string
}

export type DicomTool = 'scroll' | 'window' | 'zoom' | 'pan' | 'measure'
