import * as Dialog from '@radix-ui/react-dialog'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui'

const walkthroughSteps = [
  {
    title: 'Task',
    description: 'Start with the task prompt. It tells you what to inspect or decide right now.',
  },
  {
    title: 'Clues',
    description: 'Open relevant clues and review them before you commit to an answer.',
  },
  {
    title: 'Case notes',
    description: 'Pin useful clues or spatial findings and update your working hypotheses.',
  },
  {
    title: 'Primary action',
    description: 'Use the main action in the task to check, complete or continue your work.',
  },
] as const

interface CaseWalkthroughProps {
  open: boolean
  onClose: () => void
}

export function CaseWalkthrough({ open, onClose }: CaseWalkthroughProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = walkthroughSteps[stepIndex]!
  const lastStep = stepIndex === walkthroughSteps.length - 1

  const close = () => {
    setStepIndex(0)
    onClose()
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) close()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-neutral-950/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-overlay outline-none sm:p-7">
          <p className="text-caption font-bold tracking-wide text-brand-700 uppercase">
            Coach walkthrough · {stepIndex + 1} of {walkthroughSteps.length}
          </p>
          <Dialog.Title className="mt-2 text-heading font-bold text-neutral-950">
            How this case works
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-small text-neutral-600">
            These four areas stay with you throughout the case.
          </Dialog.Description>

          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-5">
            <h3 className="text-title font-bold text-neutral-950">{step.title}</h3>
            <p className="mt-2 text-neutral-700">{step.description}</p>
          </div>

          <ol className="mt-5 flex gap-2" aria-label="Walkthrough progress">
            {walkthroughSteps.map(({ title }, index) => (
              <li
                aria-current={index === stepIndex ? 'step' : undefined}
                aria-label={`${title}: ${index < stepIndex ? 'complete' : index === stepIndex ? 'current' : 'upcoming'}`}
                className={`h-1.5 flex-1 rounded-full ${
                  index <= stepIndex ? 'bg-brand-700' : 'bg-brand-100'
                }`}
                key={title}
              />
            ))}
          </ol>

          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            {stepIndex === 0 ? (
              <Button variant="ghost" onClick={close}>
                Skip
              </Button>
            ) : (
              <Button
                leadingIcon={<ArrowLeft aria-hidden="true" size={16} />}
                variant="secondary"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                Back
              </Button>
            )}
            {lastStep ? (
              <Button leadingIcon={<Check aria-hidden="true" size={16} />} onClick={close}>
                Start case
              </Button>
            ) : (
              <Button onClick={() => setStepIndex((current) => current + 1)}>
                Next <ArrowRight aria-hidden="true" size={16} />
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
