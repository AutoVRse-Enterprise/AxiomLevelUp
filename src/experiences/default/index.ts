import { defaultExperienceShell } from '@/app/experienceShell'
import { createDefaultRoutes } from '@/experiences/default/routes'
import type { ExperienceDefinition } from '@/experiences/types'

const experience = {
  id: 'default',
  contentBaseUrl: '/content',
  createRoutes: createDefaultRoutes,
  shell: defaultExperienceShell,
} satisfies ExperienceDefinition

export default experience
