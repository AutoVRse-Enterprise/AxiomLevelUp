import { Outlet } from 'react-router'

import { PageHeader } from '@/components/navigation/PageHeader'
import { CelebrationHost } from '@/components/rewards/CelebrationHost'

export function ImmersiveLayout() {
  return (
    <div className="min-h-dvh bg-neutral-0">
      <CelebrationHost suppressDuringSession />
      <PageHeader immersive />
      <main className="mx-auto w-full max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
