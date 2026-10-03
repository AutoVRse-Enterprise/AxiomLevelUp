import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'min-w-0 break-words rounded-lg border border-neutral-200 bg-white p-5 shadow-card sm:p-6',
        interactive &&
          'transition-[border-color,box-shadow,transform] duration-250 ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-overlay',
        className,
      )}
      {...props}
    />
  )
}
