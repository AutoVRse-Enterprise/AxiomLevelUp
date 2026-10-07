import { useState } from 'react'

import { Button } from '@/components/ui'
import { Sheet } from '@/components/ui/Sheet'
import type { GameConfig } from '@/content/schema/game'
import type { CreditedAsset } from '@/engines/games/credits'

type GameCopy = NonNullable<GameConfig['copy']>

export function CreditsSheet({
  credits,
  copy,
}: {
  credits: readonly CreditedAsset[]
  copy: GameCopy
}) {
  const [open, setOpen] = useState(false)
  if (!credits.length) return null

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="secondary">
        {copy.credits}
      </Button>
      <Sheet
        description={copy.creditsDescription}
        onOpenChange={setOpen}
        open={open}
        title={copy.credits}
      >
        <ul className="space-y-5">
          {credits.map((asset) => (
            <li
              className="space-y-1 border-b border-neutral-200 pb-4 last:border-0"
              key={asset.assetId}
            >
              <h3 className="font-semibold text-neutral-950">
                {asset.provenance.title ?? asset.assetId}
              </h3>
              <p className="text-small text-neutral-700">{asset.provenance.author}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
                <a
                  className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                  href={asset.provenance.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.source}
                </a>
                <a
                  className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                  href={asset.provenance.licenceUrl ?? asset.provenance.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.licence}: {asset.provenance.licence}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  )
}
