import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'

import type { Plugin } from 'vite'

import type { ExperienceBuildMetadata } from '../../src/experiences/types.ts'

interface ContentManifest {
  appConfig: string
  courses: string[]
  cases: string[]
  anatomyMaps: string[]
  rounds: string[]
  games: string[]
  seeds: Record<string, string>
  assetManifest: string
}

interface AssetManifest {
  assets: Array<{
    path: string
    sha256?: string
    type: string
  }>
}

export interface ScopedPublicRelease {
  publicFiles: Set<string>
  precacheEntries: Array<{ url: string; revision: string | null }>
  precachePatterns: string[]
}

function posix(path: string) {
  return path.split(sep).join('/')
}

function withoutLeadingSlash(path: string) {
  return path.replace(/^\/+/, '')
}

function contentPath(contentRoot: string, path: string) {
  return posix(resolve(contentRoot, path))
}

export function resolveScopedPublicRelease(
  root: string,
  experience: ExperienceBuildMetadata,
): ScopedPublicRelease | null {
  if (!experience.releaseStaticPaths) return null

  const publicRoot = resolve(root, 'public')
  const contentRoot = resolve(root, experience.contentDir)
  const contentPrefix = `${posix(relative(publicRoot, contentRoot))}/`
  const manifest = JSON.parse(
    readFileSync(resolve(contentRoot, 'manifest.json'), 'utf8'),
  ) as ContentManifest
  const contentFiles = [
    'manifest.json',
    manifest.appConfig,
    ...manifest.courses,
    ...manifest.cases,
    ...manifest.anatomyMaps,
    ...manifest.rounds,
    ...manifest.games,
    ...Object.values(manifest.seeds),
    manifest.assetManifest,
  ]
  const assetManifest = JSON.parse(
    readFileSync(contentPath(contentRoot, manifest.assetManifest), 'utf8'),
  ) as AssetManifest
  const assetFiles = assetManifest.assets.map(({ path }) => withoutLeadingSlash(path))
  const publicFiles = new Set([
    ...experience.releaseStaticPaths,
    ...contentFiles.map((path) => `${contentPrefix}${posix(path)}`),
    ...assetFiles,
  ])

  for (const file of publicFiles) {
    assert.ok(
      existsSync(resolve(publicRoot, file)),
      `Scoped ${experience.id} release references missing public file: ${file}`,
    )
  }

  return {
    publicFiles,
    precachePatterns: [
      'index.html',
      'manifest.webmanifest',
      'assets/*.{js,css,woff2}',
      ...experience.releaseStaticPaths.filter(
        (path) => !/assets\/icons\/(?:pwa-|maskable-)/.test(path),
      ),
      ...contentFiles.map((path) => `${contentPrefix}${posix(path)}`),
    ],
    precacheEntries: assetManifest.assets.map((asset) => ({
      url: asset.type === 'model' && asset.sha256 ? `${asset.path}?v=${asset.sha256}` : asset.path,
      revision: asset.sha256 ?? null,
    })),
  }
}

function removeEmptyDirectories(directory: string, root: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const child = resolve(directory, entry.name)
    removeEmptyDirectories(child, root)
    if (readdirSync(child).length === 0 && child !== root) rmSync(child, { recursive: true })
  }
}

export function scopedPublicReleasePlugin(
  root: string,
  experience: ExperienceBuildMetadata,
  release: ScopedPublicRelease | null,
): Plugin | null {
  if (!release) return null

  return {
    name: 'scoped-public-release',
    enforce: 'post',
    closeBundle() {
      const outputRoot = resolve(root, experience.outDir)
      const visit = (directory: string) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const absolute = resolve(directory, entry.name)
          if (entry.isDirectory()) {
            visit(absolute)
            continue
          }
          const outputPath = posix(relative(outputRoot, absolute))
          const generated =
            outputPath === 'index.html' ||
            outputPath === 'manifest.webmanifest' ||
            outputPath === 'sw.js' ||
            /^assets\/[^/]+\.(?:js|css|woff2)$/.test(outputPath)
          if (!generated && !release.publicFiles.has(outputPath)) rmSync(absolute)
        }
      }
      visit(outputRoot)
      removeEmptyDirectories(outputRoot, outputRoot)
    },
  }
}
