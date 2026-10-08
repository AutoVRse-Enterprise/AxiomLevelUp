import { useState } from 'react'

import { Button } from '@/components/ui'
import { Sheet } from '@/components/ui/Sheet'
import type { GameConfig } from '@/content/schema/game'

export function DisplayNamePrompt({
  copy,
  open,
  onOpenChange,
  onSave,
  onSkip,
}: {
  copy: NonNullable<GameConfig['share']>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  onSkip: () => void
}) {
  const [name, setName] = useState('')

  return (
    <Sheet
      description={copy.nameDescription}
      onOpenChange={onOpenChange}
      open={open}
      title={copy.nameTitle}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const trimmed = name.trim()
          if (trimmed) onSave(trimmed.slice(0, 40))
        }}
      >
        <label className="block text-small font-semibold text-neutral-800">
          {copy.nameLabel}
          <input
            autoComplete="name"
            className="mt-1 min-h-11 w-full rounded-md border border-neutral-300 px-3 font-normal"
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!name.trim()} type="submit">
            {copy.saveName}
          </Button>
          <Button onClick={onSkip} variant="secondary">
            {copy.skipName}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
