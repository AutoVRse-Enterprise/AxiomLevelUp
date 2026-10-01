import { ArrowLeft } from 'lucide-react'
import { Outlet, useNavigate } from 'react-router'

import { IconButton } from '@/components/ui'

export function ImmersiveLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-neutral-0">
      <header
        className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex min-h-14 items-center px-2 sm:px-4">
          <IconButton
            icon={<ArrowLeft aria-hidden="true" size={20} />}
            label="Go back"
            onClick={() => navigate(-1)}
          />
          <span className="ml-2 font-semibold">Learning activity</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
