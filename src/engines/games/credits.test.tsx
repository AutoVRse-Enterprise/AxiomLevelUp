import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { CreditsSheet } from '@/components/game/CreditsSheet'
import type { ContentRegistry } from '@/content/loader'
import type { GameConfig } from '@/content/schema/game'
import { collectRunCredits, type CreditedAsset } from '@/engines/games/credits'

const provenance = {
  title: 'Microscopy source',
  sourceUrl: 'https://example.test/source',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  author: 'Example author',
}

describe('game credits', () => {
  it('collects and deduplicates primitive, clue and anatomy-map assets', () => {
    const image = {
      id: 'answer',
      type: 'image_hotspot',
      content: {
        mode: 'assess',
        assetId: 'image',
        alt: 'Image',
        prompt: 'Find it',
        answerLabel: 'Finding',
        regions: [{ id: 'target', label: 'Target', shape: 'circle', x: 0.5, y: 0.5, radius: 0.1 }],
        targetRegionIds: ['target'],
        explanation: 'Explanation',
        compare: { assetId: 'reference', alt: 'Reference', label: 'Reference' },
      },
      completion: { mode: 'answer' },
    }
    const registry = {
      roundById: new Map([
        [
          'round',
          {
            id: 'round',
            anatomyMapId: 'map',
            primitive: image,
            primitiveByOptionSet: { similar: image },
            clues: [{ id: 'clue', title: 'Clue', primitive: image }],
          },
        ],
      ]),
      anatomyMapById: new Map([['map', { modelAssetId: 'model' }]]),
      assetById: new Map(
        ['image', 'reference', 'model'].map((assetId) => [
          assetId,
          {
            assetId,
            path: `/${assetId}`,
            type: assetId === 'model' ? 'model' : 'image',
            offlineRequired: false,
            offlineAvailable: true,
            sizeBytes: 1,
            sha256: 'a'.repeat(64),
            provenance,
          },
        ]),
      ),
    } as unknown as Pick<ContentRegistry, 'roundById' | 'anatomyMapById' | 'assetById'>

    expect(collectRunCredits(['round', 'round'], registry).map(({ assetId }) => assetId)).toEqual([
      'image',
      'reference',
      'model',
    ])
  })

  it('opens an accessible source and licence sheet', async () => {
    const user = userEvent.setup()
    const credit = {
      assetId: 'image',
      path: '/image',
      type: 'image',
      offlineRequired: false,
      offlineAvailable: true,
      sizeBytes: 1,
      sha256: 'a'.repeat(64),
      provenance,
    } as CreditedAsset
    const copy = {
      credits: 'Credits',
      creditsDescription: 'Sources used in this run.',
      source: 'Source',
      licence: 'Licence',
    } as NonNullable<GameConfig['copy']>
    render(<CreditsSheet copy={copy} credits={[credit]} />)

    await user.click(screen.getByRole('button', { name: 'Credits' }))
    expect(screen.getByRole('dialog', { name: 'Credits' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Source' })).toHaveAttribute(
      'href',
      provenance.sourceUrl,
    )
    expect(screen.getByRole('link', { name: /Licence/ })).toHaveAttribute(
      'href',
      provenance.licenceUrl,
    )
  })
})
