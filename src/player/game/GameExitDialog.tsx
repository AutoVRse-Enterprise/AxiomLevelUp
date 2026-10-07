import { Button, Sheet } from '@/components/ui'
import type { GameConfig } from '@/content/schema/game'

export function GameExitDialog({
  open,
  copy,
  onOpenChange,
  onExit,
}: {
  open: boolean
  copy: NonNullable<GameConfig['copy']>
  onOpenChange: (open: boolean) => void
  onExit: () => void
}) {
  return (
    <Sheet
      description={copy.leaveGameDescription}
      onOpenChange={onOpenChange}
      open={open}
      title={copy.leaveGameTitle}
    >
      <div className="flex flex-col gap-3">
        <Button onClick={onExit} variant="danger">
          {copy.leaveGame}
        </Button>
        <Button onClick={() => onOpenChange(false)} variant="secondary">
          {copy.keepPlaying}
        </Button>
      </div>
    </Sheet>
  )
}
