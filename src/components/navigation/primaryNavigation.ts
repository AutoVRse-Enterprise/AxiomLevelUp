import { BrainCircuit, Home, RadioTower, Trophy, UserRound, type LucideIcon } from 'lucide-react'

export interface PrimaryNavigationItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

export const primaryNavigation = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/learn', label: 'Learn', icon: BrainCircuit, end: false },
  { to: '/challenge', label: 'Challenge', icon: RadioTower, end: false },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, end: false },
  { to: '/profile', label: 'Profile', icon: UserRound, end: false },
] as const satisfies readonly PrimaryNavigationItem[]
