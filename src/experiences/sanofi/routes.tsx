import { lazy } from 'react'
import type { RouteObject } from 'react-router'

import { createLazyPage } from '@/app/lazyPage'
import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'
import { HomePage } from '@/experiences/sanofi/HomePage'
import { sanofiExperienceShell } from '@/experiences/sanofi/shell'
import { AppShell } from '@/layouts/AppShell'
import { GameLayout } from '@/layouts/GameLayout'

const NotFoundPage = lazy(() =>
  import('@/routes/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const PlayGamePage = lazy(() =>
  import('@/routes/games/PlayGamePage').then((module) => ({ default: module.PlayGamePage })),
)
const GameResultPage = lazy(() =>
  import('@/routes/games/GameResultPage').then((module) => ({ default: module.GameResultPage })),
)
const lazyPage = createLazyPage(sanofiExperienceShell.copy.routeLoading)

export function createSanofiRoutes(): RouteObject[] {
  return [
    {
      element: <AppShell />,
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: <HomePage />, handle: { title: 'Play' } },
        {
          path: 'results/:runId',
          element: lazyPage(<GameResultPage />),
          handle: { title: 'Result' },
        },
        { path: '*', element: lazyPage(<NotFoundPage />), handle: { title: 'Not found' } },
      ],
    },
    {
      element: <GameLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        {
          path: 'play/:gameId',
          element: lazyPage(<PlayGamePage />),
          handle: { title: 'Play' },
        },
      ],
    },
  ]
}
