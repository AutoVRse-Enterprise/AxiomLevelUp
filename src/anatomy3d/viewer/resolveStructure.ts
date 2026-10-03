import type { AnatomyMap } from '@/content/schema/anatomyMap'

type AnatomyStructure = AnatomyMap['structures'][number]

interface RankedStructure {
  structure: AnatomyStructure
  depth: number
  index: number
}

function ancestryDepth(
  structure: AnatomyStructure,
  structureById: ReadonlyMap<string, AnatomyStructure>,
) {
  const visited = new Set<string>([structure.id])
  let parentId = structure.parentId
  let depth = 0

  while (parentId && !visited.has(parentId)) {
    const parent = structureById.get(parentId)
    if (!parent) break
    depth += 1
    visited.add(parentId)
    parentId = parent.parentId
  }

  return depth
}

function compareSpecificity(left: RankedStructure, right: RankedStructure) {
  if (left.depth !== right.depth) return right.depth - left.depth
  const leftBindingCount = 'meshNames' in left.structure ? left.structure.meshNames.length : 1
  const rightBindingCount = 'meshNames' in right.structure ? right.structure.meshNames.length : 1
  if (leftBindingCount !== rightBindingCount) {
    return leftBindingCount - rightBindingCount
  }
  if (left.structure.id < right.structure.id) return -1
  if (left.structure.id > right.structure.id) return 1
  return left.index - right.index
}

export function resolveStructure(
  meshNameHits: readonly string[],
  structures: readonly AnatomyStructure[],
  allowedLevelIds?: readonly string[],
  structureIdHits: readonly string[] = [],
): string | null {
  const allowedLevels = allowedLevelIds ? new Set(allowedLevelIds) : null
  const structureById = new Map(structures.map((structure) => [structure.id, structure]))
  const ranked = structures.map((structure, index): RankedStructure => ({
    structure,
    depth: ancestryDepth(structure, structureById),
    index,
  }))

  for (const structureId of structureIdHits) {
    const direct = ranked
      .filter(
        ({ structure }) =>
          structure.id === structureId && (!allowedLevels || allowedLevels.has(structure.levelId)),
      )
      .sort(compareSpecificity)
    if (direct[0]) return direct[0].structure.id
  }

  for (const meshName of meshNameHits) {
    const candidates = ranked
      .filter(
        ({ structure }) =>
          (!allowedLevels || allowedLevels.has(structure.levelId)) &&
          'meshNames' in structure &&
          structure.meshNames.includes(meshName),
      )
      .sort(compareSpecificity)
    if (candidates[0]) return candidates[0].structure.id
  }

  return null
}
