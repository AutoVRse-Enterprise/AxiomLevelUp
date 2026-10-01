import { createBrowserRouter } from 'react-router'

import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'
import { AppShell } from '@/layouts/AppShell'
import { ImmersiveLayout } from '@/layouts/ImmersiveLayout'
import { ChallengePage } from '@/routes/challenge/ChallengePage'
import { DevPage } from '@/routes/dev/DevPage'
import { PrimitiveGalleryPage } from '@/routes/dev/PrimitiveGalleryPage'
import { TokenPreviewPage } from '@/routes/dev/TokenPreviewPage'
import { HomePage } from '@/routes/home/HomePage'
import { CoursePage } from '@/routes/learn/CoursePage'
import { LearnPage } from '@/routes/learn/LearnPage'
import { PathwayPage } from '@/routes/learn/PathwayPage'
import { LeaderboardPage } from '@/routes/leaderboard/LeaderboardPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { ChallengePlayerPage } from '@/routes/play/ChallengePlayerPage'
import { LessonPlayerPage } from '@/routes/play/LessonPlayerPage'
import { ProfilePage } from '@/routes/profile/ProfilePage'

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
      { path: 'dev', element: <DevPage />, handle: { title: 'Development' } },
      {
        path: 'dev/primitives',
        element: <PrimitiveGalleryPage />,
        handle: { title: 'Primitive gallery' },
      },
      { path: 'dev/tokens', element: <TokenPreviewPage />, handle: { title: 'Design tokens' } },
      { path: '*', element: <NotFoundPage />, handle: { title: 'Not found' } },
    ],
  },
  {
    element: <ImmersiveLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: 'learn/courses/:courseId/lessons/:lessonId',
        element: <LessonPlayerPage />,
        handle: { title: 'Lesson' },
      },
      {
        path: 'challenge/:challengeId/play',
        element: <ChallengePlayerPage />,
        handle: { title: 'Challenge' },
      },
    ],
  },
])
