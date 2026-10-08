import { Home, Trophy, UserRound } from 'lucide-react'

import type { ExperienceShellConfig } from '@/app/experienceShell'
import { BestScoreStatus } from '@/components/game/BestScoreStatus'
import { SyntheticCaseNotice } from '@/components/game/SyntheticCaseNotice'

export const sanofiExperienceShell: ExperienceShellConfig = {
  navigation: [
    { to: '/', label: 'Play', icon: Home, end: true },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, end: false },
    { to: '/you', label: 'You', icon: UserRound, end: false },
  ],
  headerStatus: BestScoreStatus,
  footerNotice: SyntheticCaseNotice,
  installPrompt: false,
  copy: {
    routeLoading: {
      title: 'Opening screen',
      message: 'Loading this part of the challenge.',
    },
    contentLoading: {
      title: 'Loading challenge data',
      message: 'Checking game settings and scientific assets.',
    },
    contentError: {
      title: 'Challenge data could not be loaded',
      message: 'The game settings could not be checked. Reload after they are corrected.',
      reloadLabel: 'Reload challenge',
    },
    stateLoading: {
      title: 'Preparing your profile',
      message: 'Restoring your scores and active run.',
    },
    stateError: {
      title: 'Score storage is unavailable',
      retryLabel: 'Retry',
    },
    applicationError: {
      title: 'The challenge could not continue',
      reloadLabel: 'Reload challenge',
      homeLabel: 'Return to play',
    },
    notFound: {
      title: 'Page not found',
      message: 'The address does not match a playable screen.',
      homeLabel: 'Return to play',
    },
    updateNotice: {
      title: 'Update available',
      message: 'Reload to use the newest challenge data and offline support.',
      reloadLabel: 'Reload',
      laterLabel: 'Later',
    },
  },
}
