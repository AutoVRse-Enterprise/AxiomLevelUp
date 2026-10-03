import {
  isVolumeStructure,
  type AnatomyStructure,
  type AnatomyVolumeStructure,
} from './schema/anatomyMap'

type Vector3 = readonly [number, number, number]
type Ellipsoid = AnatomyVolumeStructure['volume']

export interface AnatomyVolumeValidationOptions {
  ancestorFitTolerance: number
  sameLevelOverlapTolerance: number
}

export interface AnatomyVolumeIssue {
  structureIndex: number
  field: 'parentId' | 'volume'
  message: string
}

interface ModelBounds {
  min: Vector3
  max: Vector3
}

function rotateX([x, y, z]: Vector3, angle: number): Vector3 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return [x, y * cosine - z * sine, y * sine + z * cosine]
}

function rotateY([x, y, z]: Vector3, angle: number): Vector3 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return [x * cosine + z * sine, y, -x * sine + z * cosine]
}

function rotateZ([x, y, z]: Vector3, angle: number): Vector3 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return [x * cosine - y * sine, x * sine + y * cosine, z]
}

function rotate(vector: Vector3, rotation: Vector3 = [0, 0, 0]): Vector3 {
  return rotateZ(rotateY(rotateX(vector, rotation[0]), rotation[1]), rotation[2])
}

function inverseRotate(vector: Vector3, rotation: Vector3 = [0, 0, 0]): Vector3 {
  return rotateX(rotateY(rotateZ(vector, -rotation[2]), -rotation[1]), -rotation[0])
}

function add(left: Vector3, right: Vector3): Vector3 {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]]
}

function subtract(left: Vector3, right: Vector3): Vector3 {
  return [left[0] - right[0], left[1] - right[1], left[2] - right[2]]
}

function length(vector: Vector3) {
  return Math.hypot(...vector)
}

function scale(vector: Vector3, factor: number): Vector3 {
  return [vector[0] * factor, vector[1] * factor, vector[2] * factor]
}

function normalized(vector: Vector3): Vector3 {
  const magnitude = length(vector)
  return magnitude === 0 ? [1, 0, 0] : scale(vector, 1 / magnitude)
}

function radialDistance(ellipsoid: Ellipsoid, worldDirection: Vector3) {
  const localDirection = inverseRotate(normalized(worldDirection), ellipsoid.rotation)
  return (
    1 /
    Math.sqrt(
      (localDirection[0] / ellipsoid.radii[0]) ** 2 +
        (localDirection[1] / ellipsoid.radii[1]) ** 2 +
        (localDirection[2] / ellipsoid.radii[2]) ** 2,
    )
  )
}

function normalizedEllipsoidDistance(ellipsoid: Ellipsoid, point: Vector3) {
  const local = inverseRotate(subtract(point, ellipsoid.center), ellipsoid.rotation)
  return Math.sqrt(
    (local[0] / ellipsoid.radii[0]) ** 2 +
      (local[1] / ellipsoid.radii[1]) ** 2 +
      (local[2] / ellipsoid.radii[2]) ** 2,
  )
}

function ellipsoidExtremePoints(ellipsoid: Ellipsoid) {
  const axes: Vector3[] = [
    [ellipsoid.radii[0], 0, 0],
    [0, ellipsoid.radii[1], 0],
    [0, 0, ellipsoid.radii[2]],
  ]
  return axes.flatMap((axis) => {
    const offset = rotate(axis, ellipsoid.rotation)
    return [add(ellipsoid.center, offset), subtract(ellipsoid.center, offset)]
  })
}

/**
 * Returns center-line penetration as a ratio of the smaller directional radius.
 * Zero means separated; one means overlap by at least one smaller radius.
 */
export function ellipsoidOverlapRatio(left: Ellipsoid, right: Ellipsoid) {
  const delta = subtract(right.center, left.center)
  const distance = length(delta)
  if (distance === 0) return 1
  const direction = normalized(delta)
  const leftRadius = radialDistance(left, direction)
  const rightRadius = radialDistance(right, scale(direction, -1))
  return Math.max(
    0,
    Math.min(1, (leftRadius + rightRadius - distance) / Math.min(leftRadius, rightRadius)),
  )
}

/**
 * Uses the child center and six rotated axis extremes. This intentionally allows a small configured
 * authoring tolerance instead of claiming patient-grade geometric containment.
 */
export function ellipsoidFitsInside(child: Ellipsoid, ancestor: Ellipsoid, tolerance: number) {
  return [child.center, ...ellipsoidExtremePoints(child)].every(
    (point) => normalizedEllipsoidDistance(ancestor, point) <= 1 + tolerance,
  )
}

export function ellipsoidFitsModelBounds(
  ellipsoid: Ellipsoid,
  bounds: ModelBounds,
  tolerance: number,
) {
  const span: Vector3 = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  ]
  const rotatedAxes = [
    rotate([ellipsoid.radii[0], 0, 0], ellipsoid.rotation),
    rotate([0, ellipsoid.radii[1], 0], ellipsoid.rotation),
    rotate([0, 0, ellipsoid.radii[2]], ellipsoid.rotation),
  ]
  const extents: Vector3 = [
    Math.hypot(...rotatedAxes.map((axis) => axis[0])),
    Math.hypot(...rotatedAxes.map((axis) => axis[1])),
    Math.hypot(...rotatedAxes.map((axis) => axis[2])),
  ]
  return ellipsoid.center.every(
    (coordinate, axis) =>
      coordinate - extents[axis]! >= bounds.min[axis]! - span[axis]! * tolerance &&
      coordinate + extents[axis]! <= bounds.max[axis]! + span[axis]! * tolerance,
  )
}

function nearestVolumeAncestor(
  structure: AnatomyVolumeStructure,
  structureById: ReadonlyMap<string, AnatomyStructure>,
) {
  const visited = new Set<string>([structure.id])
  let parentId = structure.parentId
  while (parentId && !visited.has(parentId)) {
    const parent = structureById.get(parentId)
    if (!parent) return null
    if (isVolumeStructure(parent)) return parent
    visited.add(parentId)
    parentId = parent.parentId
  }
  return null
}

export function validateAnatomyVolumes(
  structures: readonly AnatomyStructure[],
  modelBounds: ModelBounds | undefined,
  options: AnatomyVolumeValidationOptions,
): AnatomyVolumeIssue[] {
  const issues: AnatomyVolumeIssue[] = []
  const structureById = new Map(structures.map((structure) => [structure.id, structure]))
  const volumes = structures.flatMap((structure, structureIndex) =>
    isVolumeStructure(structure) ? [{ structure, structureIndex }] : [],
  )

  volumes.forEach(({ structure, structureIndex }) => {
    const parent = structure.parentId ? structureById.get(structure.parentId) : undefined
    if (!parent) {
      issues.push({
        structureIndex,
        field: 'parentId',
        message: `Volume structure "${structure.id}" requires a resolvable mesh or volume parent.`,
      })
      return
    }

    const volumeAncestor = nearestVolumeAncestor(structure, structureById)
    if (
      volumeAncestor &&
      !ellipsoidFitsInside(structure.volume, volumeAncestor.volume, options.ancestorFitTolerance)
    ) {
      issues.push({
        structureIndex,
        field: 'volume',
        message: `Volume structure "${structure.id}" does not fit meaningfully inside volume ancestor "${volumeAncestor.id}".`,
      })
    } else if (
      !volumeAncestor &&
      modelBounds &&
      !ellipsoidFitsModelBounds(structure.volume, modelBounds, options.ancestorFitTolerance)
    ) {
      issues.push({
        structureIndex,
        field: 'volume',
        message: `Volume structure "${structure.id}" falls outside the model bounds used by mesh ancestor "${parent.id}".`,
      })
    }
  })

  for (let leftIndex = 0; leftIndex < volumes.length; leftIndex += 1) {
    const left = volumes[leftIndex]!
    for (let rightIndex = leftIndex + 1; rightIndex < volumes.length; rightIndex += 1) {
      const right = volumes[rightIndex]!
      if (left.structure.levelId !== right.structure.levelId) continue
      const overlap = ellipsoidOverlapRatio(left.structure.volume, right.structure.volume)
      if (overlap <= options.sameLevelOverlapTolerance) continue
      issues.push({
        structureIndex: right.structureIndex,
        field: 'volume',
        message: `Volume structure "${right.structure.id}" overlaps same-level volume "${left.structure.id}" by ${overlap.toFixed(3)}, above the configured tolerance ${options.sameLevelOverlapTolerance.toFixed(3)}.`,
      })
    }
  }

  return issues
}
