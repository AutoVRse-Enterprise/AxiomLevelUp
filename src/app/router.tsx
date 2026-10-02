import { createBrowserRouter } from 'react-router'
import { lazy, Suspense, type ReactNode } from 'react'

import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'
import { Skeleton } from '@/components/ui'
import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'
import { ChallengePage } from '@/routes/challenge/ChallengePage'
import { HomePage } from '@/routes/home/HomePage'
import { CoursePage } from '@/routes/learn/CoursePage'
import { LearnPage } from '@/routes/learn/LearnPage'
import { PathwayPage } from '@/routes/learn/PathwayPage'
import { LeaderboardPage } from '@/routes/leaderboard/LeaderboardPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { ProfilePage } from '@/routes/profile/ProfilePage'

const DevPage = lazy(() => import('@/routes/dev/DevPage').then((module) => ({ default: module.DevPage })))
const PrimitiveGalleryPage = lazy(() =>
  import('@/routes/dev/PrimitiveGalleryPage').then((module) => ({
    default: module.PrimitiveGalleryPage,
  })),
)
const TokenPreviewPage = lazy(() =>
  import('@/routes/dev/TokenPreviewPage').then((module) => ({ default: module.TokenPreviewPage })),
)
const LessonPlayerPage = lazy(() =>
  import('@/routes/play/LessonPlayerPage').then((module) => ({ default: module.LessonPlayerPage })),
)
const ChallengePlayerPage = lazy(() =>
  import('@/routes/play/ChallengePlayerPage').then((module) => ({
    default: module.ChallengePlayerPage,
  })),
)

function lazyPage(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-3xl space-y-5 p-5 sm:p-8">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-48 w-full" />
          <span className="sr-only" role="status">
            Loading screen
          </span>
        </main>
      }
    >
      {page}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage />, handle: { title: 'Home' } },
      { path: 'learn', element: <LearnPage />, handle: { title: 'Learn' } },
      {
        path: 'learn/pathways/:pathwayId',
        element: <PathwayPage />,
        handle: { title: 'Pathway' },
      },
      {
        path: 'learn/courses/:courseId',
        element: <CoursePage />,
        handle: { title: 'Course' },
      },
      { path: 'challenge', element: <ChallengePage />, handle: { title: 'Challenges' } },
      { path: 'leaderboard', element: <LeaderboardPage />, handle: { title: 'Leaderboard' } },
      { path: 'profile', element: <ProfilePage />, handle: { title: 'Profile' } },
      { path: 'dev', element: lazyPage(<DevPage />), handle: { title: 'Development' } },
      {
        path: 'dev/primitives',
        element: lazyPage(<PrimitiveGalleryPage />),
        handle: { title: 'Primitive gallery' },
      },
      {
        path: 'dev/tokens',
        element: lazyPage(<TokenPreviewPage />),
        handle: { title: 'Design tokens' },
      },
      { path: '*', element: <NotFoundPage />, handle: { title: 'Not found' } },
    ],
  },
  {
    element: <ImmersiveLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: 'learn/courses/:courseId/lessons/:lessonId',
        element: lazyPage(<LessonPlayerPage />),
        handle: { title: 'Lesson' },
      },
      {
        path: 'challenge/:challengeId/play',
        element: lazyPage(<ChallengePlayerPage />),
        handle: { title: 'Challenge' },
      },
    ],
  },
])
