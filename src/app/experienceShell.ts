import { createContext, useContext, type ComponentType } from 'react'

import {
  primaryNavigation,
  type PrimaryNavigationItem,
} from '@/components/navigation/primaryNavigation'

export interface ExperienceShellCopy {
  routeLoading: { title: string; message: string }
  contentLoading: { title: string; message: string }
  contentError: { title: string; message: string; reloadLabel: string }
  stateLoading: { title: string; message: string }
  stateError: { title: string; retryLabel: string }
  applicationError: { title: string; reloadLabel: string; homeLabel: string }
  notFound: { title: string; message: string; homeLabel: string }
  updateNotice: {
    title: string
    message: string
    reloadLabel: string
    laterLabel: string
  }
}

export interface ExperienceShellConfig {
  navigation: readonly PrimaryNavigationItem[]
  headerStatus: 'learner' | 'none' | ComponentType
  footerNotice?: ComponentType
  installPrompt: boolean
  copy: ExperienceShellCopy
}

export const defaultExperienceShell: ExperienceShellConfig = {
  navigation: primaryNavigation,
  headerStatus: 'learner',
  installPrompt: true,
  copy: {
    routeLoading: {
      title: 'Opening screen',
      message: 'Loading this part of your learning experience.',
    },
    contentLoading: {
      title: 'Loading learning content',
      message: 'Validating courses, activities and scientific assets.',
    },
    contentError: {
      title: 'Course content could not be loaded',
      message:
        'The course configuration did not pass validation. Reload after the content source has been corrected.',
      reloadLabel: 'Reload content',
    },
    stateLoading: {
      title: 'Preparing your learning space',
      message: 'Restoring your progress and active learning session.',
    },
    stateError: {
      title: 'Progress storage is unavailable',
      retryLabel: 'Retry',
    },
    applicationError: {
      title: 'The learning experience could not continue',
      reloadLabel: 'Reload application',
      homeLabel: 'Return home',
    },
    notFound: {
      title: 'Page not found',
      message: 'The address does not match a learning experience.',
      homeLabel: 'Return home',
    },
    updateNotice: {
      title: 'Update available',
      message: 'Reload to use the newest learning content and offline support.',
      reloadLabel: 'Reload',
      laterLabel: 'Later',
    },
  },
}

const ExperienceShellContext = createContext(defaultExperienceShell)

export const ExperienceShellProvider = ExperienceShellContext.Provider

export function useExperienceShell() {
  return useContext(ExperienceShellContext)
}
