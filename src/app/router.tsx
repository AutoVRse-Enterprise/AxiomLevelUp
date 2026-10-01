import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'

import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'
import { Skeleton } from '@/components/ui'
import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'
import {
  ChallengePage,
  HomePage,
  ImmersivePlaceholder,
  LeaderboardPage,
  LearnPage,
  NotFoundPage,
  ParameterPage,
  ProfilePage,
} from '@/routes/PlaceholderPages'
import { DevPage } from '@/routes/dev/DevPage'
import { TokenPreviewPage } from '@/routes/dev/TokenPreviewPage'

const DicomSpikePage = lazy(async () => {
  const module = await import('@/spikes/dicom/DicomSpikePage')
  return { default: module.DicomSpikePage }
})

function LazyDicomSpike() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-5">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-[60dvh] w-full" />
        </div>
      }
    >
      <DicomSpikePage />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'learn', element: <LearnPage /> },
      {
        path: 'learn/pathways/:pathwayId',
        element: <ParameterPage kind="Pathway" />,
      },
      {
        path: 'learn/courses/:courseId',
        element: <ParameterPage kind="Course" />,
      },
      { path: 'challenge', element: <ChallengePage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'dev', element: <DevPage /> },
      { path: 'dev/tokens', element: <TokenPreviewPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <ImmersiveLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: 'learn/courses/:courseId/lessons/:lessonId',
        element: <ImmersivePlaceholder kind="Lesson" />,
      },
      {
        path: 'challenge/:challengeId/play',
        element: <ImmersivePlaceholder kind="Challenge" />,
      },
      { path: 'dev/dicom-spike', element: <LazyDicomSpike /> },
    ],
  },
])
