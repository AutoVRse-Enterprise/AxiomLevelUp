import tailwindcss from '@tailwindcss/vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(() => {
  return {
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
          name: 'Axiom Learning Runtime',
          short_name: 'Axiom Learn',
          description: 'Interactive scientific and medical learning',
          theme_color: '#0f766e',
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
        events: resolve(
          fileURLToPath(new URL('.', import.meta.url)),
          'node_modules/events/events.js',
        ),
        url: resolve(fileURLToPath(new URL('.', import.meta.url)), 'node_modules/url/url.js'),
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
