import { animate, useMotionValue, useMotionValueEvent } from 'motion/react'
import { useEffect, useState } from 'react'

import { useResolvedMotion } from '@/design/motion'
import { cn } from '@/lib/cn'

interface AnimatedNumberProps {
  value: number
  durationMs?: number
  className?: string
  format?: (value: number) => string
}

export function AnimatedNumber({
  value,
  durationMs = 700,
  className,
  format = (current) => Math.round(current).toLocaleString(),
}: AnimatedNumberProps) {
  const resolvedMotion = useResolvedMotion()
  const motionValue = useMotionValue(value)
  const [displayed, setDisplayed] = useState(value)

  useMotionValueEvent(motionValue, 'change', setDisplayed)

  useEffect(() => {
    if (resolvedMotion === 'reduced') {
      motionValue.jump(value)
      return
    }
    return animate(motionValue, value, {
      duration: durationMs / 1000,
      ease: [0.2, 0, 0, 1],
    }).stop
  }, [durationMs, motionValue, resolvedMotion, value])

  return (
    <span className={cn('tabular-nums', className)} aria-label={format(value)}>
      <span aria-hidden="true">{format(displayed)}</span>
    </span>
  )
}
