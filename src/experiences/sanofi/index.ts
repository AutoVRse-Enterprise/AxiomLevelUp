import '@/experiences/sanofi/theme.css'

import { createSanofiRoutes } from '@/experiences/sanofi/routes'
import { sanofiExperienceShell } from '@/experiences/sanofi/shell'
import type { ExperienceDefinition } from '@/experiences/types'

const experience = {
  id: 'sanofi',
  contentBaseUrl: '/experiences/sanofi/content',
  createRoutes: createSanofiRoutes,
  shell: sanofiExperienceShell,
} satisfies ExperienceDefinition

export default experience
