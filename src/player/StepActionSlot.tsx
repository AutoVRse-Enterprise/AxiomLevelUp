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
          'sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 rounded-xl border border-neutral-200 bg-white/95 p-2 shadow-overlay backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        className,
      )}
      data-step-action-slot=""
    >
      {children}
    </div>
  )
}
