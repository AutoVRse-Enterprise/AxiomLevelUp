import type {
  DicomExplorePrimitive,
  DicomGuidedPrimitive,
  DicomIdentifyRegionPrimitive,
  DicomMeasurePrimitive,
} from '@/content/schema/primitives'
import {
  evaluateDicomExplore,
  evaluateDicomMeasurement,
  evaluateDicomRegion,
  evaluateGuidedCheckpoint,
} from '@/imaging/evaluation'
import { exploreRequirementKeys } from '@/imaging/requirements'
import { definePrimitive } from '@/primitives/definitions/types'

export const dicomExploreDefinition = definePrimitive<DicomExplorePrimitive>({
  type: 'dicom_explore',
  family: 'domain',
  label: 'DICOM exploration',
  layout: 'viewer',
  timerCompatible: false,
  scored: () => false,
  evaluate: evaluateDicomExplore,
  reviewPrompt: (primitive) => primitive.content.prompt,
  explorableKeys: exploreRequirementKeys,
})

export const dicomGuidedDefinition = definePrimitive<DicomGuidedPrimitive>({
  type: 'dicom_guided',
  family: (primitive) => (primitive.content.checkpoint ? 'assessment' : 'domain'),
  label: 'Guided DICOM inspection',
  layout: 'viewer',
  timerCompatible: false,
  scored: (primitive) => Boolean(primitive.content.checkpoint),
  evaluate: evaluateGuidedCheckpoint,
  reviewPrompt: (primitive) => primitive.content.prompt,
  explorableKeys: (primitive) => primitive.content.steps.map(({ id }) => id),
})

export const dicomIdentifyRegionDefinition = definePrimitive<DicomIdentifyRegionPrimitive>({
  type: 'dicom_identify_region',
  family: 'assessment',
  label: 'DICOM region identification',
  layout: 'viewer',
  timerCompatible: false,
  scored: () => true,
  evaluate: evaluateDicomRegion,
  reviewPrompt: (primitive) => primitive.content.prompt,
})

export const dicomMeasureDefinition = definePrimitive<DicomMeasurePrimitive>({
  type: 'dicom_measure',
  family: 'assessment',
  label: 'DICOM measurement',
  layout: 'viewer',
  timerCompatible: false,
  scored: () => true,
  evaluate: evaluateDicomMeasurement,
  reviewPrompt: (primitive) => primitive.content.prompt,
})
