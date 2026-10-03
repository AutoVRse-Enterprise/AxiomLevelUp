import { ScrollRestoration } from 'react-router'

import { PageHeader } from '@/components/navigation/PageHeader'
import { RouteTransition } from '@/components/navigation/RouteTransition'
import { DeferredCelebrationHost } from '@/components/rewards/DeferredCelebrationHost'

export function ImmersiveLayout() {
  return (
    <div className="min-h-dvh bg-neutral-0">
      <a
        className="fixed left-3 top-3 z-toast -translate-y-20 rounded-md bg-brand-800 px-4 py-2 font-bold text-white transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to activity
      </a>
      <DeferredCelebrationHost suppressDuringSession />
      <PageHeader immersive />
      <main className="mx-auto w-full max-w-7xl" id="main-content">
        <RouteTransition />
      </main>
      <ScrollRestoration />
    </div>
  )
}
