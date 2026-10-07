import { Button, Card } from '@/components/ui'
import type { GameConfig } from '@/content/schema/game'

export function GameResumePrompt({
  copy,
  onContinue,
  onNew,
}: {
  copy: NonNullable<GameConfig['copy']>
  onContinue: () => void
  onNew: () => void
}) {
  return (
    <Card className="mx-auto mt-16 max-w-lg p-7 text-center">
      <h1 className="text-heading font-bold">{copy.resumeTitle}</h1>
      <p className="mt-2 text-neutral-600">{copy.resumeDescription}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button onClick={onContinue}>{copy.continueGame}</Button>
        <Button onClick={onNew} variant="secondary">
          {copy.newGame}
        </Button>
      </div>
    </Card>
  )
}
