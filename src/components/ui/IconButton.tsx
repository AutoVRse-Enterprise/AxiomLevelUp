import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
}

export function IconButton({ label, icon, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      type={type}
      className={cn(
        'inline-grid size-11 place-items-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  )
}
