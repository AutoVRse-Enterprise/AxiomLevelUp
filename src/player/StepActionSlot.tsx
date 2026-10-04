import { createContext, useContext, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface StepActionSlotProps {
  children: ReactNode
  className?: string
}

const StickyStepActionsContext = createContext(false)

export function StepActionScope({
  sticky,
  children,
}: {
  sticky: boolean
  children: ReactNode
}) {
  return (
    <StickyStepActionsContext.Provider value={sticky}>
      {children}
    </StickyStepActionsContext.Provider>
  )
}

export function StepActionSlot({ children, className }: StepActionSlotProps) {
  const sticky = useContext(StickyStepActionsContext)

  return (
    <div
      className={cn(
        'mt-6 flex justify-end',
        sticky &&
          'fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-20 w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white/95 p-2 shadow-overlay backdrop-blur md:static md:w-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        className,
      )}
      data-step-action-slot=""
    >
      {children}
    </div>
  )
}
