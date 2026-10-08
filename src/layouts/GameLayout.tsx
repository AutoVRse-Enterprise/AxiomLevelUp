import { Outlet } from 'react-router'

import { useContent } from '@/app/contentContext'
import { useExperienceShell } from '@/app/experienceShell'

export function GameLayout() {
  const copy = useContent().appConfig.games?.copy
  const { footerNotice: FooterNotice } = useExperienceShell()
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
      {FooterNotice ? (
        <footer className="mx-auto w-full max-w-6xl px-4 py-3 text-neutral-300 sm:px-6">
          <FooterNotice />
        </footer>
      ) : null}
    </div>
  )
}
