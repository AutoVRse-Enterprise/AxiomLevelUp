import { describe, expect, it } from 'vitest'

import { mapInteractionToEvents } from '@/player/interactionEvents'
import { shouldRevealAnswer } from '@/player/reviewPolicy'
import {
  clampPanZoom,
  normalizedToScreen,
  screenToNormalized,
  zoomAtPoint,
} from '@/primitives/shared/panZoomMath'
import {
  ensureUnsolvedOrder,
  seededShuffle,
  seededUnsolvedOrder,
} from '@/primitives/shared/seededShuffle'

describe('pan and zoom math', () => {
  it('clamps scale and pan to the visible viewport', () => {
    expect(
      clampPanZoom(
        { x: 50, y: -500, scale: 8 },
        { width: 200, height: 100 },
        { width: 200, height: 100 },
        1,
        4,
      ),
    ).toEqual({ x: 0, y: -300, scale: 4 })
  })

  it('keeps the point under the cursor stable while zooming', () => {
    const point = { x: 75, y: 40 }
    const before = { x: -25, y: -10, scale: 1 }
    const after = zoomAtPoint(before, 2, point)

    expect((point.x - before.x) / before.scale).toBe((point.x - after.x) / after.scale)
    expect((point.y - before.y) / before.scale).toBe((point.y - after.y) / after.scale)
  })

  it('maps between screen and normalized artifact coordinates', () => {
    const bounds = { left: 100, top: 50, width: 400, height: 200 }
    const transform = { x: -40, y: -20, scale: 2 }
    const normalized = { x: 0.5, y: 0.25 }
    const screen = normalizedToScreen(normalized, bounds, transform)

    expect(screenToNormalized(screen, bounds, transform)).toEqual(normalized)
    expect(screenToNormalized({ x: -100, y: 999 }, bounds)).toEqual({ x: 0, y: 1 })
  })
})

describe('seeded shuffle', () => {
  it('returns a deterministic permutation without mutating the input', () => {
    const input = ['a', 'b', 'c', 'd']

    expect(seededShuffle(input, 'activity:attempt')).toEqual(
      seededShuffle(input, 'activity:attempt'),
    )
    expect(seededShuffle(input, 'activity:attempt').sort()).toEqual(input)
    expect(input).toEqual(['a', 'b', 'c', 'd'])
  })

  it('ensures an ordering exercise does not start solved', () => {
    const solved = ['a', 'b', 'c']

    expect(ensureUnsolvedOrder(solved, solved)).not.toEqual(solved)
    expect(seededUnsolvedOrder(solved, 'any-seed')).not.toEqual(solved)
    expect(ensureUnsolvedOrder(['only'], ['only'])).toEqual(['only'])
  })
})

describe('player policies and event mapping', () => {
  it('applies answer reveal policy at the effective final attempt', () => {
    const context = { attempt: 1, maxAttempts: 2, retry: true, correct: false }

    expect(shouldRevealAnswer('never', { ...context, attempt: 2 })).toBe(false)
    expect(shouldRevealAnswer('always', context)).toBe(true)
    expect(shouldRevealAnswer('final_attempt', context)).toBe(false)
    expect(shouldRevealAnswer('final_attempt', { ...context, attempt: 2 })).toBe(true)
    expect(shouldRevealAnswer('final_attempt', { ...context, retry: false })).toBe(true)
    expect(shouldRevealAnswer('final_attempt', { ...context, correct: true })).toBe(true)
  })

  it('maps scenario decisions and emits only newly crossed media milestones', () => {
    const context = {
      activityKind: 'lesson' as const,
      activityId: 'lesson-1',
      primitiveId: 'primitive-1',
      primitiveType: 'scenario',
    }
    const scenarioEvents = mapInteractionToEvents(
      context,
      {
        name: 'scenario_decision',
        nodeId: 'node-1',
        choiceId: 'choice-1',
        decisionIndex: 0,
      },
      0,
    )
    const mediaEvents = mapInteractionToEvents(
      { ...context, primitiveType: 'video' },
      { name: 'media_progress', fraction: 0.76 },
      0.5,
    )

    expect(scenarioEvents.map(({ event }) => event)).toEqual([
      'artifact_interacted',
      'scenario_decision_made',
    ])
    expect(
      mediaEvents
        .filter((event) => event.event === 'media_progressed')
        .map((event) => event.milestone),
    ).toEqual([75])
  })
})
