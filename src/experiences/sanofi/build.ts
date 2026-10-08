import type { ExperienceBuildMetadata } from '@/experiences/types'

export const sanofiBuild = {
  id: 'sanofi',
  html: {
    title: 'Autovrse LevelUp',
    description: 'Fast, replayable scientific challenges from Autovrse.',
    themeColor: '#0f766e',
  },
  pwa: {
    name: 'Autovrse LevelUp',
    short_name: 'LevelUp',
    description: 'Fast, replayable scientific challenges from Autovrse',
    theme_color: '#0f766e',
    background_color: '#071b1e',
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
  devPort: 5174,
  previewPort: 4174,
  outDir: 'dist-sanofi',
  devPwaTempDir: 'dev-dist-sanofi',
  contentDir: 'public/experiences/sanofi/content',
  precacheIgnore: ['content/**'],
  releaseStaticPaths: [
    'assets/icons/app-icon.svg',
    'assets/icons/apple-touch-icon-180x180.png',
    'assets/icons/favicon.ico',
    'assets/icons/maskable-icon-512x512.png',
    'assets/icons/pwa-64x64.png',
    'assets/icons/pwa-192x192.png',
    'assets/icons/pwa-512x512.png',
    'brand/autovrse-logo.svg',
  ],
} satisfies ExperienceBuildMetadata
