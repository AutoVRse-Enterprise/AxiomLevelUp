import { NavLink, ScrollRestoration } from 'react-router'

import { PageHeader } from '@/components/navigation/PageHeader'
import { primaryNavigation } from '@/components/navigation/primaryNavigation'
import { RouteTransition } from '@/components/navigation/RouteTransition'
import { PwaPromptHost } from '@/components/pwa/PwaPromptHost'
import { CelebrationHost } from '@/components/rewards/CelebrationHost'
import { cn } from '@/lib/cn'

export function AppShell() {
  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <a
        className="fixed left-3 top-3 z-toast -translate-y-20 rounded-md bg-brand-800 px-4 py-2 font-bold text-white transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <CelebrationHost />
      <PwaPromptHost />
      <PageHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8" id="main-content">
        <RouteTransition />
      </main>
      <ScrollRestoration />

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-nav border-t border-neutral-200 bg-white/95 backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid min-h-16 max-w-xl grid-cols-5">
          {primaryNavigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-semibold transition-colors',
                  isActive ? 'text-brand-700' : 'text-neutral-600 hover:text-neutral-800',
                )
              }
              end={end}
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" size={21} strokeWidth={2.1} />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
