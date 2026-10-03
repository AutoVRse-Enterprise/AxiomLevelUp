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
  if (left.structure.meshNames.length !== right.structure.meshNames.length) {
    return left.structure.meshNames.length - right.structure.meshNames.length
  }
  if (left.structure.id < right.structure.id) return -1
  if (left.structure.id > right.structure.id) return 1
  return left.index - right.index
}

export function resolveStructure(
  meshNameHits: readonly string[],
  structures: readonly AnatomyStructure[],
  allowedLevelIds?: readonly string[],
): string | null {
  const allowedLevels = allowedLevelIds ? new Set(allowedLevelIds) : null
  const structureById = new Map(structures.map((structure) => [structure.id, structure]))
  const ranked = structures.map((structure, index): RankedStructure => ({
    structure,
    depth: ancestryDepth(structure, structureById),
    index,
  }))

  for (const meshName of meshNameHits) {
    const candidates = ranked
      .filter(
        ({ structure }) =>
          (!allowedLevels || allowedLevels.has(structure.levelId)) &&
          structure.meshNames.includes(meshName),
      )
      .sort(compareSpecificity)
    if (candidates[0]) return candidates[0].structure.id
  }

  return null
}
