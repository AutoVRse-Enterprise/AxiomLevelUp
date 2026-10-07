import gameMapDocument from '../../../public/experiences/sanofi/content/anatomy/respiratory-game-map.json'
import appConfigDocument from '../../../public/experiences/sanofi/content/app-config.json'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { anatomyMapSchema, appConfigSchema } from '@/content/schema'
import type { GameConfig } from '@/content/schema/game'
import type { PlannedRound } from '@/engines/games/plan'
import { PinReveal } from '@/player/game/PinReveal'

const viewer = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }))
vi.mock('@/anatomy3d/viewer/AnatomyViewer', () => ({
  AnatomyViewer: (props: Record<string, unknown>) => {
    viewer.props = props
    return <div>Comparison viewer</div>
  },
}))
vi.mock('@/content/useAssetUrl', () => ({
  useAsset: () => ({ path: '/lung.glb' }),
}))

const map = anatomyMapSchema.parse(gameMapDocument)
const config = appConfigSchema.parse(appConfigDocument).product.anatomy3d
const copy = {
  pinGuessLabel: 'Your pin',
  pinActualLabel: 'Actual location',
  pinRevealPrompt: 'Compare.',
} as NonNullable<GameConfig['copy']>

describe('PinReveal', () => {
  it('compares the selected and actual lobe and segment', () => {
    const plannedRound = {
      primitive: {
        type: 'anatomy_locate',
        content: {
          levels: [
            { levelId: 'lobe', input: 'model', targetStructureId: 'right-lower-lobe' },
            {
              levelId: 'segment',
              input: 'structure_choice',
              targetStructureId: 'right-lower-superior-segment',
            },
          ],
        },
      },
    } as unknown as PlannedRound
    render(
      <PinReveal
        config={config}
        copy={copy}
        map={map}
        plannedRound={plannedRound}
        response={{
          lobe: 'left-lower-lobe',
          segment: 'left-lower-superior-segment',
        }}
      />,
    )

    expect(screen.getByText('Your pin')).toBeVisible()
    expect(screen.getByText('Actual location')).toBeVisible()
    expect(viewer.props?.comparison).toEqual({
      guessStructureIds: ['left-lower-lobe', 'left-lower-superior-segment'],
      actualStructureIds: ['right-lower-lobe', 'right-lower-superior-segment'],
    })
  })
})
