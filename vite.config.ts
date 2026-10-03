import tailwindcss from '@tailwindcss/vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import { resolveBuildId } from './scripts/build/build-id.ts'

export default defineConfig(({ mode }) => {
  const root = fileURLToPath(new URL('.', import.meta.url))
  const environment = loadEnv(mode, root, '')
  const packageVersion = (
    JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version: string }
  ).version
  const buildId = resolveBuildId(
    root,
    environment.VITE_BUILD_ID ?? environment.CI_COMMIT_SHA ?? environment.GITHUB_SHA,
    packageVersion,
  )

  return {
    define: {
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      viteCommonjs(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: null,
        manifest: {
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
            {
              src: '/assets/icons/pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: '/assets/icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/assets/icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/assets/icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,json,svg,png,ico,woff2}'],
          globIgnores: [
            '**/*.dcm',
            '**/*.dicom',
            'assets/icons/pwa-*.png',
            'assets/icons/maskable-*.png',
          ],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        events: resolve(root, 'node_modules/events/events.js'),
        url: resolve(root, 'node_modules/url/url.js'),
      },
    },
    optimizeDeps: {
      exclude: ['@cornerstonejs/dicom-image-loader'],
      include: ['dicom-parser'],
    },
    worker: {
      format: 'es' as const,
    },
    build: {
      rolldownOptions: {
        output: {
          strictExecutionOrder: true,
        },
      },
    },
  }
})
