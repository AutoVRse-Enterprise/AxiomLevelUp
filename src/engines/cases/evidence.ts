import type { AnatomyMap } from '@/content/schema'
import type { CaseProgress } from '@/engines/learning/session'

export type CaseEvidenceItem = CaseProgress['evidence']['pinned'][number]

export function isCaseEvidencePinned(pinned: readonly CaseEvidenceItem[], item: CaseEvidenceItem) {
  return pinned.some((candidate) => candidate.kind === item.kind && candidate.id === item.id)
}

export function canPinCaseEvidence(
  item: CaseEvidenceItem,
  reviewedClueIds: readonly string[],
  inspectedFindingIds: ReadonlySet<string>,
) {
  return item.kind === 'clue' ? reviewedClueIds.includes(item.id) : inspectedFindingIds.has(item.id)
}

export function updateCaseEvidencePins(
  pinned: readonly CaseEvidenceItem[],
  item: CaseEvidenceItem,
  shouldPin: boolean,
) {
  const alreadyPinned = isCaseEvidencePinned(pinned, item)
  if (alreadyPinned === shouldPin) return pinned
  if (!shouldPin) {
    return pinned.filter((candidate) => candidate.kind !== item.kind || candidate.id !== item.id)
  }
  return [...pinned, item]
}

export function resolveCaseLocationLabel(
  anatomyMap: AnatomyMap | undefined,
  location: CaseProgress['evidence']['currentLocation'],
) {
  if (!anatomyMap || !location) return null
  if (location.kind === 'structure') {
    return anatomyMap.structures.find(({ id }) => id === location.id)?.label ?? null
  }
  return anatomyMap.waypoints.find(({ id }) => id === location.id)?.label ?? null
}
