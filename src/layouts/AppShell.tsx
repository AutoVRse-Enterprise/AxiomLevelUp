import { NavLink, ScrollRestoration } from 'react-router'

import { useExperienceShell } from '@/app/experienceShell'
import { BuildStamp } from '@/components/navigation/BuildStamp'
import { PageHeader } from '@/components/navigation/PageHeader'
import { RouteTransition } from '@/components/navigation/RouteTransition'
import { PwaPromptHost } from '@/components/pwa/PwaPromptHost'
import { DeferredCelebrationHost } from '@/components/rewards/DeferredCelebrationHost'
import { cn } from '@/lib/cn'

export function AppShell() {
  const { navigation, footerNotice: FooterNotice } = useExperienceShell()
  const hasBottomNavigation = navigation.length > 1
  const columnClass =
    (
      {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      } as const
    )[navigation.length as 2 | 3 | 4 | 5 | 6] ?? 'grid-cols-1'

  return (
    <div
      className={
        hasBottomNavigation
          ? 'flex min-h-dvh flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0'
          : 'flex min-h-dvh flex-col'
      }
    >
      <a
        className="fixed left-3 top-3 z-toast -translate-y-20 rounded-md bg-brand-800 px-4 py-2 font-bold text-white transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <DeferredCelebrationHost />
      <PwaPromptHost />
      <PageHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8" id="main-content">
        <RouteTransition />
      </main>
      {FooterNotice ? (
        <footer className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
          <FooterNotice />
        </footer>
      ) : null}
      <ScrollRestoration />
      <BuildStamp />

      {hasBottomNavigation ? (
        <nav
          aria-label="Primary navigation"
          className="fixed bottom-0 left-0 z-nav w-[100vw] max-w-[100vw] overflow-x-hidden border-t border-neutral-200 bg-white/95 backdrop-blur-lg lg:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className={cn('mx-auto grid min-h-16 w-[100vw] min-w-0 max-w-xl', columnClass)}>
            {navigation.map(({ to, label, icon: Icon, end }) => (
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
                <span className="block w-full min-w-0 truncate text-center">{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
