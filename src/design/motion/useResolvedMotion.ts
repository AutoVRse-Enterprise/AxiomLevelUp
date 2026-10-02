import { useEffect, useState } from 'react'

import { usePreferencesStore } from '@/state/preferences'

export type ResolvedMotion = 'full' | 'reduced'

function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export function useResolvedMotion(): ResolvedMotion {
  const preference = usePreferencesStore((state) => state.motion)
  const systemReduced = useSystemReducedMotion()
  if (preference === 'reduced') return 'reduced'
  if (preference === 'full') return 'full'
  return systemReduced ? 'reduced' : 'full'
}
