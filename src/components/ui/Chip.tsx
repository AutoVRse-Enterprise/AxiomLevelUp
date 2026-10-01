import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type ChipTone = 'neutral' | 'brand' | 'success' | 'warning'

const tones: Record<ChipTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  brand: 'bg-brand-100 text-brand-800',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
}

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: ChipTone
}

export function Chip({ tone = 'neutral', className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full px-3 text-caption font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
