import { createBrowserRouter } from 'react-router'

import experience from '@experience'
import type { ExperienceDefinition } from '@/experiences/types'
import { createDefaultRoutes } from '@/experiences/default/routes'

const devToolsEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true'

export function createExperienceRouter(
  definition: ExperienceDefinition,
  enableDevTools = devToolsEnabled,
) {
  return createBrowserRouter(definition.createRoutes(enableDevTools))
}

export function createAppRoutes(enableDevTools = devToolsEnabled) {
  return createDefaultRoutes(enableDevTools)
}

export const router = createExperienceRouter(experience)
