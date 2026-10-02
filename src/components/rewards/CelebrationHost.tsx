import * as Dialog from '@radix-ui/react-dialog'
import { Award, Sparkles } from 'lucide-react'
import { m } from 'motion/react'
import { useEffect } from 'react'

import { useContent } from '@/app/contentContext'
import { AnimatedNumber, Button } from '@/components/ui'
import { celebrateVariants, useResolvedMotion } from '@/design/motion'
import { useActivitySessionStore } from '@/engines/learning/sessionStore'
import { playConfetti } from '@/effects/confetti'
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
  const resolvedMotion = useResolvedMotion()

  useEffect(() => {
    if (!celebration) return
    void playConfetti(
      celebration.type === 'level' ? 'level_up' : 'badge',
      celebration.id,
      appConfig.product.presentation.confetti,
      resolvedMotion === 'reduced',
    )
  }, [appConfig.product.presentation.confetti, celebration, resolvedMotion])

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
        <Dialog.Overlay asChild>
          <m.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-celebration bg-neutral-950/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <m.div
            animate="visible"
            className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-brand-100 bg-[linear-gradient(155deg,var(--color-neutral-0)_65%,var(--color-brand-50))] p-6 text-center shadow-overlay outline-none"
            initial="hidden"
            variants={celebrateVariants}
          >
          <m.div
            animate={{ rotate: [0, -5, 5, 0], scale: [0.8, 1.08, 1] }}
            className="mx-auto grid size-16 place-items-center rounded-full bg-brand-100 text-brand-800"
            transition={{ delay: 0.1, duration: 0.55 }}
          >
            {celebration.type === 'badge' ? (
              <Award aria-hidden="true" size={34} />
            ) : (
              <Sparkles aria-hidden="true" size={34} />
            )}
          </m.div>
          <Dialog.Title className="mt-5 text-title font-bold text-neutral-950">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-neutral-700">{description}</Dialog.Description>
          {celebration.type === 'badge' && celebration.rewardXp > 0 ? (
            <p className="mt-4 font-bold text-brand-800">
              <AnimatedNumber
                format={(value) => `+${Math.round(value).toLocaleString()} XP bonus`}
                value={celebration.rewardXp}
              />
            </p>
          ) : null}
          <Dialog.Close asChild>
            <Button className="mt-6 w-full" size="lg">
              Continue
            </Button>
          </Dialog.Close>
          </m.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
