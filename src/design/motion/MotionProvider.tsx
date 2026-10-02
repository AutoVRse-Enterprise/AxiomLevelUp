import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { type ReactNode, useEffect } from 'react'

import { useResolvedMotion } from '@/design/motion/useResolvedMotion'
import { usePreferencesStore } from '@/state/preferences'

export function MotionProvider({ children }: { children: ReactNode }) {
  const preference = usePreferencesStore((state) => state.motion)
  const resolved = useResolvedMotion()
  const reducedMotion =
    preference === 'system' ? 'user' : preference === 'reduced' ? 'always' : 'never'

  useEffect(() => {
    document.documentElement.dataset.motion = resolved
  }, [resolved])

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>
    </LazyMotion>
  )
}
