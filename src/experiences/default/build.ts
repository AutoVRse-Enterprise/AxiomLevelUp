import type { ExperienceBuildMetadata } from '@/experiences/types'

export const defaultBuild = {
  id: 'default',
  html: null,
  pwa: {
    name: 'Autovrse LevelUp',
    short_name: 'LevelUp',
    description: 'Interactive scientific and medical learning from Autovrse',
    theme_color: '#5c4acf',
    background_color: '#f7f9f8',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    orientation: 'any',
    icons: [
      { src: '/assets/icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: '/assets/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/assets/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  devPort: 5173,
  previewPort: 4173,
  outDir: 'dist',
  devPwaTempDir: 'dev-dist',
  contentDir: 'public/content',
  precacheIgnore: ['experiences/**'],
  releaseStaticPaths: null,
} satisfies ExperienceBuildMetadata
