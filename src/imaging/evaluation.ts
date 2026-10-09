import type {
  DicomExplorePrimitive,
  DicomGuidedPrimitive,
  DicomIdentifyRegionPrimitive,
  DicomMeasurePrimitive,
  NormalizedPoint,
} from '@/content/schema/primitives'
import { isSliceInRange, pointInRegion } from '@/imaging/geometry'
import {
  exploreRequirementKeys,
  parseExploreObservation,
  satisfiedExploreRequirements,
} from '@/imaging/requirements'
import type { EvaluationResult } from '@/primitives/types'

export function evaluateDicomExplore(
  primitive: DicomExplorePrimitive,
  response: unknown,
): EvaluationResult {
  const expected = exploreRequirementKeys(primitive)
  if (expected.length === 0) {
    return { score: 1, correct: true, explanation: null }
  }
  const observation = parseExploreObservation(response)
  const satisfied = new Set(
    observation ? satisfiedExploreRequirements(primitive, observation) : [],
  )
  const matched = expected.filter((key) => satisfied.has(key)).length
  return {
    score: matched / expected.length,
    correct: matched === expected.length,
    explanation: null,
    items: Object.fromEntries(
      expected.map((key) => [key, satisfied.has(key) ? 'correct' : 'incorrect']),
    ),
  }
}

export interface DicomRegionResponse {
  slice: number
  point: NormalizedPoint
}

export interface DicomMeasurementResponse {
  slice: number
  value: number
  unit: string
  start?: NormalizedPoint
  end?: NormalizedPoint
}

export function evaluateGuidedCheckpoint(
  primitive: DicomGuidedPrimitive,
  response: unknown,
): EvaluationResult {
  const checkpoint = primitive.content.checkpoint
  const correct = Boolean(checkpoint && response === checkpoint.correctOptionId)
  return {
    score: Number(correct),
    correct,
    explanation: checkpoint?.explanation ?? null,
    items: { checkpoint: correct ? 'correct' : 'incorrect' },
  }
}

export function evaluateDicomRegion(
  primitive: DicomIdentifyRegionPrimitive,
  response: unknown,
): EvaluationResult {
  const parsed = parseRegionResponse(response)
  const correctSlice = Boolean(
    parsed && isSliceInRange(parsed.slice, primitive.content.target.sliceRange),
  )
  const correctLocation = Boolean(
    parsed && pointInRegion(parsed.point, primitive.content.target.region),
  )
  return {
    score: (Number(correctSlice) + Number(correctLocation)) / 2,
    correct: correctSlice && correctLocation,
    explanation: primitive.content.explanation,
    items: {
      slice: correctSlice ? 'correct' : 'incorrect',
      location: correctLocation ? 'correct' : 'incorrect',
    },
  }
}

export function evaluateDicomMeasurement(
  primitive: DicomMeasurePrimitive,
  response: unknown,
): EvaluationResult {
  const parsed = parseMeasurementResponse(response)
  const correctSlice = Boolean(
    parsed && isSliceInRange(parsed.slice, primitive.content.target.sliceRange),
  )
  const physical = parsed?.unit.toLowerCase() === 'mm'
  const expected = primitive.content.target.expected
  const tolerance =
    expected.tolerance.mode === 'percent'
      ? expected.valueMm * (expected.tolerance.value / 100)
      : expected.tolerance.value
  const correctValue = Boolean(
    parsed && physical && Math.abs(parsed.value - expected.valueMm) <= tolerance,
  )
  return {
    score: physical ? (Number(correctSlice) + Number(correctValue)) / 2 : 0,
    correct: correctSlice && correctValue,
    explanation: physical
      ? primitive.content.explanation
      : 'This study did not provide a calibrated millimetre measurement.',
    items: {
      slice: correctSlice ? 'correct' : 'incorrect',
      measurement: correctValue ? 'correct' : 'incorrect',
    },
  }
}

function parseRegionResponse(response: unknown): DicomRegionResponse | null {
  if (!response || typeof response !== 'object') return null
  const candidate = response as Partial<DicomRegionResponse>
  if (!Number.isInteger(candidate.slice) || !isPoint(candidate.point)) return null
  return candidate as DicomRegionResponse
}

function parseMeasurementResponse(response: unknown): DicomMeasurementResponse | null {
  if (!response || typeof response !== 'object') return null
  const candidate = response as Partial<DicomMeasurementResponse>
  if (
    !Number.isInteger(candidate.slice) ||
    typeof candidate.value !== 'number' ||
    !Number.isFinite(candidate.value) ||
    candidate.value < 0 ||
    typeof candidate.unit !== 'string'
  ) {
    return null
  }
  return candidate as DicomMeasurementResponse
}

function isPoint(point: unknown): point is NormalizedPoint {
  if (!point || typeof point !== 'object') return false
  const candidate = point as Partial<NormalizedPoint>
  return (
    typeof candidate.x === 'number' &&
    candidate.x >= 0 &&
    candidate.x <= 1 &&
    typeof candidate.y === 'number' &&
    candidate.y >= 0 &&
    candidate.y <= 1
  )
}
