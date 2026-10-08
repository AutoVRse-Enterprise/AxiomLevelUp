import tailwindcss from '@tailwindcss/vite'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import { resolveBuildId } from './scripts/build/build-id.ts'
import {
  resolveScopedPublicRelease,
  scopedPublicReleasePlugin,
} from './scripts/experiences/scoped-public.ts'
import { getExperienceBuild } from './src/experiences/builds.ts'
import { resolveExperienceId } from './src/lib/experienceIds.ts'

export default defineConfig(({ mode }) => {
  const root = fileURLToPath(new URL('.', import.meta.url))
  const environment = loadEnv(mode, root, '')
  const experienceId = resolveExperienceId(
    process.env.VITE_EXPERIENCE ?? environment.VITE_EXPERIENCE,
    mode,
  )
  const experience = getExperienceBuild(experienceId)
  const scopedRelease = resolveScopedPublicRelease(root, experience)
  const scopedReleasePlugin = scopedPublicReleasePlugin(root, experience, scopedRelease)
  const packageVersion = (
    JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as { version: string }
  ).version
  const buildId = resolveBuildId(
    root,
    environment.VITE_BUILD_ID ?? environment.CI_COMMIT_SHA ?? environment.GITHUB_SHA,
    packageVersion,
    experience.contentDir,
  )

  console.log(`Active experience: ${experienceId}`)

  return {
    define: {
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
      'import.meta.env.VITE_EXPERIENCE': JSON.stringify(experienceId),
    },
    plugins: [
      {
        name: 'experience-html',
        transformIndexHtml(html: string) {
          if (!experience.html) return html
          return html
            .replace('<html lang="en">', `<html lang="en" data-experience="${experienceId}">`)
            .replace(/<title>[^<]*<\/title>/, `<title>${experience.html.title}</title>`)
            .replace(
              /<meta name="description" content="[^"]*" \/>/,
              `<meta name="description" content="${experience.html.description}" />`,
            )
            .replace(
              /<meta name="theme-color" content="[^"]*" \/>/,
              `<meta name="theme-color" content="${experience.html.themeColor}" />`,
            )
        },
      },
      react(),
      tailwindcss(),
      viteCommonjs(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: null,
        outDir: experience.outDir,
        manifest: experience.pwa,
        injectManifest: {
          globPatterns: scopedRelease?.precachePatterns ?? [
            '**/*.{js,css,html,json,svg,png,ico,woff2}',
          ],
          globIgnores: [
            '**/*.dcm',
            '**/*.dicom',
            'assets/icons/pwa-*.png',
            'assets/icons/maskable-*.png',
            ...experience.precacheIgnore,
          ],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          additionalManifestEntries: scopedRelease?.precacheEntries,
        },
        devOptions: {
          enabled: true,
          type: 'module',
          resolveTempFolder: () => resolve(root, experience.devPwaTempDir),
        },
      }),
      ...(scopedReleasePlugin ? [scopedReleasePlugin] : []),
    ],
    server: {
      port: experience.devPort,
      strictPort: true,
    },
    preview: {
      port: experience.previewPort,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@experience': resolve(root, `src/experiences/${experienceId}/index.ts`),
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
      outDir: experience.outDir,
      rolldownOptions: {
        output: {
          strictExecutionOrder: true,
        },
      },
    },
  }
})
