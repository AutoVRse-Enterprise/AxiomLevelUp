import { lazy } from 'react'
import type { RouteObject } from 'react-router'

import { createLazyPage } from '@/app/lazyPage'
import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'
import { HomePage } from '@/experiences/sanofi/HomePage'
import { sanofiExperienceShell } from '@/experiences/sanofi/shell'
import { AppShell } from '@/layouts/AppShell'

const NotFoundPage = lazy(() =>
  import('@/routes/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const lazyPage = createLazyPage(sanofiExperienceShell.copy.routeLoading)

export function createSanofiRoutes(): RouteObject[] {
  return [
    {
      element: <AppShell />,
      errorElement: <RouteErrorPage />,
      children: [
        { index: true, element: <HomePage />, handle: { title: 'Play' } },
        { path: '*', element: lazyPage(<NotFoundPage />), handle: { title: 'Not found' } },
      ],
    },
  ]
}
