import { Outlet } from 'react-router'

import { PageHeader } from '@/components/navigation/PageHeader'

export function ImmersiveLayout() {
  return (
    <div className="min-h-dvh bg-neutral-0">
      <PageHeader immersive />
      <main className="mx-auto w-full max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
