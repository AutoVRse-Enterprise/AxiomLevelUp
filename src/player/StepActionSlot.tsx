import { createContext, useContext, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface StepActionSlotProps {
  children: ReactNode
  className?: string
}

type StepActionPlacement = 'inline' | 'sticky' | 'game'

const StepActionPlacementContext = createContext<StepActionPlacement>('inline')

export function StepActionScope({
  sticky,
  placement,
  children,
}: {
  sticky?: boolean
  placement?: StepActionPlacement
  children: ReactNode
}) {
  return (
    <StepActionPlacementContext.Provider value={placement ?? (sticky ? 'sticky' : 'inline')}>
      {children}
    </StepActionPlacementContext.Provider>
  )
}

export function StepActionSlot({ children, className }: StepActionSlotProps) {
  const placement = useContext(StepActionPlacementContext)

  return (
    <div
      className={cn(
        'mt-6 flex justify-end',
        placement === 'sticky' &&
          'fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 z-20 w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white/95 p-2 shadow-overlay backdrop-blur md:static md:w-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        placement === 'game' &&
          'fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 mt-0 rounded-xl border border-white/15 bg-neutral-950/95 p-3 shadow-overlay backdrop-blur md:static md:mt-6 md:w-auto md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        className,
      )}
      data-step-action-slot=""
    >
      {children}
    </div>
  )
}
