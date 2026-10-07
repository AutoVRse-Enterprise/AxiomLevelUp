import { Outlet } from 'react-router'

import { useContent } from '@/app/contentContext'

export function GameLayout() {
  const copy = useContent().appConfig.games?.copy
  return (
    <div className="min-h-svh bg-neutral-950 text-white">
      <a
        className="sr-only z-[100] rounded bg-white p-3 text-neutral-950 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
        href="#main-content"
      >
        {copy?.skipToRound ?? 'Skip to round'}
      </a>
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}
