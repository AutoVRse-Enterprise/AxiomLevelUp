import { lazy } from 'react'

const RichTextPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/RichTextPrimitive')
  return { default: module.RichTextPrimitive }
})

const ImagePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ImagePrimitive')
  return { default: module.ImagePrimitive }
})

const ZoomableImagePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ZoomableImagePrimitive')
  return { default: module.ZoomableImagePrimitive }
})

const ImageHotspotPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ImageHotspotPrimitive')
  return { default: module.ImageHotspotPrimitive }
})

const ImageComparePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ImageComparePrimitive')
  return { default: module.ImageComparePrimitive }
})

const VideoPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/VideoPrimitive')
  return { default: module.VideoPrimitive }
})

const AudioPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/AudioPrimitive')
  return { default: module.AudioPrimitive }
})

const CarouselPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/CarouselPrimitive')
  return { default: module.CarouselPrimitive }
})

const DataTablePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/DataTablePrimitive')
  return { default: module.DataTablePrimitive }
})

const ChartPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ChartPrimitive')
  return { default: module.ChartPrimitive }
})

const FormulaPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/FormulaPrimitive')
  return { default: module.FormulaPrimitive }
})

const PdfReferencePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/PdfReferencePrimitive')
  return { default: module.PdfReferencePrimitive }
})

const MultipleChoicePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/MultipleChoicePrimitive')
  return { default: module.MultipleChoicePrimitive }
})

const MultipleSelectPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/MultipleSelectPrimitive')
  return { default: module.MultipleSelectPrimitive }
})

const TrueFalsePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/TrueFalsePrimitive')
  return { default: module.TrueFalsePrimitive }
})

const ClassificationPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ClassificationPrimitive')
  return { default: module.ClassificationPrimitive }
})

const MatchPairsPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/MatchPairsPrimitive')
  return { default: module.MatchPairsPrimitive }
})

const OrderingPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/OrderingPrimitive')
  return { default: module.OrderingPrimitive }
})

const FillBlankPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/FillBlankPrimitive')
  return { default: module.FillBlankPrimitive }
})

const NumericPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/NumericPrimitive')
  return { default: module.NumericPrimitive }
})

const ScenarioPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/ScenarioPrimitive')
  return { default: module.ScenarioPrimitive }
})

const DicomPrimitivePending = lazy(async () => {
  const module = await import('@/primitives/components/DicomPrimitivePending')
  return { default: module.DicomPrimitivePending }
})

const DicomExplorePrimitive = lazy(async () => {
  const module = await import('@/primitives/components/DicomExplorePrimitive')
  return { default: module.DicomExplorePrimitive }
})

const DicomGuidedPrimitive = lazy(async () => {
  const module = await import('@/primitives/components/DicomGuidedPrimitive')
  return { default: module.DicomGuidedPrimitive }
})

export const primitiveComponents = {
  rich_text: RichTextPrimitive,
  image: ImagePrimitive,
  zoomable_image: ZoomableImagePrimitive,
  image_hotspot: ImageHotspotPrimitive,
  image_compare: ImageComparePrimitive,
  video: VideoPrimitive,
  audio: AudioPrimitive,
  carousel: CarouselPrimitive,
  data_table: DataTablePrimitive,
  chart: ChartPrimitive,
  formula: FormulaPrimitive,
  pdf_reference: PdfReferencePrimitive,
  multiple_choice: MultipleChoicePrimitive,
  multiple_select: MultipleSelectPrimitive,
  true_false: TrueFalsePrimitive,
  classification: ClassificationPrimitive,
  match_pairs: MatchPairsPrimitive,
  ordering: OrderingPrimitive,
  fill_blank: FillBlankPrimitive,
  numeric: NumericPrimitive,
  scenario: ScenarioPrimitive,
  dicom_explore: DicomExplorePrimitive,
  dicom_guided: DicomGuidedPrimitive,
  dicom_identify_region: DicomPrimitivePending,
  dicom_measure: DicomPrimitivePending,
} as const
