import * as Dialog from '@radix-ui/react-dialog'
import { Award, Sparkles } from 'lucide-react'

import { useContent } from '@/app/contentContext'
import { Button } from '@/components/ui'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { emitEvent } from '@/events/bus'
import { useLearnerStore } from '@/state/learnerStore'

export function CelebrationHost({
  suppressDuringSession = false,
}: {
  suppressDuringSession?: boolean
}) {
  const { appConfig } = useContent()
  const celebration = useLearnerStore((state) => state.gamification.celebrations[0] ?? null)
  const activeSession = useActivitySessionStore((state) => state.session)

  if (!celebration || (suppressDuringSession && activeSession)) return null

  const badge =
    celebration.type === 'badge'
      ? appConfig.badges.find(({ id }) => id === celebration.badgeId)
      : null
  const title =
    celebration.type === 'badge'
      ? (badge?.title ?? 'Achievement unlocked')
      : `Level ${celebration.to}`
  const description =
    celebration.type === 'badge'
      ? (badge?.description ?? 'You reached a new learning milestone.')
      : `You advanced from level ${celebration.from} to level ${celebration.to}.`

  const dismiss = () =>
    emitEvent({
      event: 'celebration_dismissed',
      celebrationId: celebration.id,
    })

  return (
    <Dialog.Root open onOpenChange={(open) => !open && dismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-neutral-950/50 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 text-center shadow-overlay outline-none">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-brand-100 text-brand-800">
            {celebration.type === 'badge' ? (
              <Award aria-hidden="true" size={34} />
            ) : (
              <Sparkles aria-hidden="true" size={34} />
            )}
          </div>
          <Dialog.Title className="mt-5 text-title font-bold text-neutral-950">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-neutral-700">{description}</Dialog.Description>
          {celebration.type === 'badge' && celebration.rewardXp > 0 ? (
            <p className="mt-4 font-bold text-brand-800">+{celebration.rewardXp} XP bonus</p>
          ) : null}
          <Dialog.Close asChild>
            <Button className="mt-6 w-full" size="lg">
              Continue
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
