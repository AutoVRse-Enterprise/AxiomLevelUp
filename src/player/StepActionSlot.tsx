import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface StepActionSlotProps {
  children: ReactNode
  className?: string
}

export function StepActionSlot({ children, className }: StepActionSlotProps) {
  return (
    <div
      className={cn(
        'sticky bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-20 mt-6 flex justify-end rounded-xl border border-neutral-200 bg-white/95 p-2 shadow-overlay backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        className,
      )}
      data-step-action-slot=""
    >
      {children}
    </div>
  )
}
