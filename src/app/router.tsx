import { createBrowserRouter } from 'react-router'
import { lazy, Suspense, type ReactNode } from 'react'

import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'
import { LoadingState } from '@/components/ui'
import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'
import { HomePage } from '@/routes/home/HomePage'
const LearnPage = lazy(() =>
  import('@/routes/learn/LearnPage').then((module) => ({ default: module.LearnPage })),
)
const PathwayPage = lazy(() =>
  import('@/routes/learn/PathwayPage').then((module) => ({ default: module.PathwayPage })),
)
const CoursePage = lazy(() =>
  import('@/routes/learn/CoursePage').then((module) => ({ default: module.CoursePage })),
)
const ChallengePage = lazy(() =>
  import('@/routes/challenge/ChallengePage').then((module) => ({ default: module.ChallengePage })),
)
const LeaderboardPage = lazy(() =>
  import('@/routes/leaderboard/LeaderboardPage').then((module) => ({
    default: module.LeaderboardPage,
  })),
)
const ProfilePage = lazy(() =>
  import('@/routes/profile/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)
const NotFoundPage = lazy(() =>
  import('@/routes/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const DevPage = lazy(() =>
  import('@/routes/dev/DevPage').then((module) => ({ default: module.DevPage })),
)
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
const CaseIntroPage = lazy(() =>
  import('@/routes/cases/CaseIntroPage').then((module) => ({ default: module.CaseIntroPage })),
)
const CasePlayerPage = lazy(() =>
  import('@/routes/cases/CasePlayerPage').then((module) => ({ default: module.CasePlayerPage })),
)
const CaseAttemptPage = lazy(() =>
  import('@/routes/cases/CaseAttemptPage').then((module) => ({
    default: module.CaseAttemptPage,
  })),
)

function lazyPage(page: ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl p-5 sm:p-8">
          <LoadingState
            message="Loading this part of your learning experience."
            title="Opening screen"
          />
        </div>
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
      { path: 'learn', element: lazyPage(<LearnPage />), handle: { title: 'Learn' } },
      {
        path: 'learn/pathways/:pathwayId',
        element: lazyPage(<PathwayPage />),
        handle: { title: 'Pathway' },
      },
      {
        path: 'learn/courses/:courseId',
        element: lazyPage(<CoursePage />),
        handle: { title: 'Course' },
      },
      {
        path: 'learn/cases/:caseId',
        element: lazyPage(<CaseIntroPage />),
        handle: { title: 'Case Lab' },
      },
      {
        path: 'learn/cases/:caseId/attempts/:attemptId',
        element: lazyPage(<CaseAttemptPage />),
        handle: { title: 'Case results' },
      },
      {
        path: 'challenge',
        element: lazyPage(<ChallengePage />),
        handle: { title: 'Challenges' },
      },
      {
        path: 'leaderboard',
        element: lazyPage(<LeaderboardPage />),
        handle: { title: 'Leaderboard' },
      },
      { path: 'profile', element: lazyPage(<ProfilePage />), handle: { title: 'Profile' } },
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
      { path: '*', element: lazyPage(<NotFoundPage />), handle: { title: 'Not found' } },
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
      {
        path: 'learn/cases/:caseId/play',
        element: lazyPage(<CasePlayerPage />),
        handle: { title: 'Case Lab' },
      },
    ],
  },
])
