import { RouterProvider } from 'react-router'
import { useEffect } from 'react'

import experience from '@experience'
import { ContentProvider } from '@/app/ContentProvider'
import { ExperienceShellProvider } from '@/app/experienceShell'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { PresentationAnnouncer } from '@/components/feedback/PresentationAnnouncer'
import { MotionProvider } from '@/design/motion'
import { LearnerStateProvider } from '@/state/LearnerStateProvider'

export function App() {
  useEffect(() => {
    document.documentElement.dataset.experience = experience.id
  }, [])

  return (
    <ExperienceShellProvider value={experience.shell}>
      <ErrorBoundary copy={experience.shell.copy.applicationError}>
        <MotionProvider>
          <PresentationAnnouncer />
          <ContentProvider baseUrl={experience.contentBaseUrl} copy={experience.shell.copy}>
            <LearnerStateProvider copy={experience.shell.copy}>
              <RouterProvider router={router} />
            </LearnerStateProvider>
          </ContentProvider>
        </MotionProvider>
      </ErrorBoundary>
    </ExperienceShellProvider>
  )
}
