import type { RouteObject } from 'react-router'

import type { ExperienceShellConfig } from '@/app/experienceShell'
import type { ExperienceId } from '@/lib/experienceIds'

export interface ExperienceHtmlMetadata {
  title: string
  description: string
  themeColor: string
}

export interface ExperiencePwaIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

export interface ExperiencePwaMetadata {
  name: string
  short_name: string
  description: string
  theme_color: string
  background_color: string
  display: 'standalone'
  start_url: string
  scope: string
  orientation: 'any' | 'portrait' | 'landscape'
  icons: ExperiencePwaIcon[]
}

export interface ExperienceBuildMetadata {
  id: ExperienceId
  html: ExperienceHtmlMetadata | null
  pwa: ExperiencePwaMetadata
  devPort: number
  previewPort: number
  outDir: string
  devPwaTempDir: string
  contentDir: string
  precacheIgnore: string[]
  releaseStaticPaths: string[] | null
}

export interface ExperienceDefinition {
  id: ExperienceId
  contentBaseUrl: string
  createRoutes: (enableDevTools: boolean) => RouteObject[]
  shell: ExperienceShellConfig
}
