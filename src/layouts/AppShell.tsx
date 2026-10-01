import {
  BrainCircuit,
  Flame,
  Home,
  Medal,
  RadioTower,
  Trophy,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { useContent } from '@/app/contentContext'
import { cn } from '@/lib/cn'

const navigation = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/learn', label: 'Learn', icon: BrainCircuit, end: false },
  { to: '/challenge', label: 'Challenge', icon: RadioTower, end: false },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, end: false },
  { to: '/profile', label: 'Profile', icon: UserRound, end: false },
] as const

const routeTitles: Record<string, string> = {
  '/': 'Learning Runtime',
  '/learn': 'Learn',
  '/challenge': 'Daily Challenge',
  '/leaderboard': 'Leaderboard',
  '/profile': 'Profile',
}

function titleFor(pathname: string) {
  return (
    routeTitles[pathname] ??
    (pathname.startsWith('/learn') ? 'Learning' : pathname.startsWith('/dev') ? 'Development' : 'Learning')
  )
}

export function AppShell() {
  const { pathname } = useLocation()
  const { seed } = useContent()

  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header
        className="sticky top-0 z-20 border-b border-neutral-200/80 bg-neutral-50/90 backdrop-blur-lg"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <p className="text-caption font-semibold tracking-wide text-brand-700 uppercase">
              Axiom
            </p>
            <p className="font-bold text-neutral-900">{titleFor(pathname)}</p>
          </div>
          <div className="flex items-center gap-3 text-small font-semibold" aria-label="Learner status">
            <span className="flex items-center gap-1 text-xp">
              <Medal aria-hidden="true" size={17} /> {seed.xp.total.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-streak">
              <Flame aria-hidden="true" size={17} /> {seed.streak.currentDays}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid min-h-16 max-w-xl grid-cols-5">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-semibold transition-colors',
                  isActive ? 'text-brand-700' : 'text-neutral-500 hover:text-neutral-800',
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
