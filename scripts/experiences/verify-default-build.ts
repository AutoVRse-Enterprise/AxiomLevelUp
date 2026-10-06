import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

interface DefaultBuildBaseline {
  manifest: Record<string, unknown>
  html: {
    language: string
    title: string
    description: string
    themeColor: string
    favicon: string
    logo: string
    appleTouchIcon: string
  }
}

function capture(source: string, pattern: RegExp, label: string) {
  const value = pattern.exec(source)?.[1]
  assert.ok(value, `Default index.html is missing ${label}.`)
  return value
}

const root = process.cwd()
const baseline = JSON.parse(
  await readFile(
    resolve(root, 'scripts/experiences/default-build-baseline.json'),
    'utf8',
  ),
) as DefaultBuildBaseline
const manifest = JSON.parse(
  await readFile(resolve(root, 'dist/manifest.webmanifest'), 'utf8'),
) as Record<string, unknown>
const html = await readFile(resolve(root, 'dist/index.html'), 'utf8')
const serviceWorker = await readFile(resolve(root, 'dist/sw.js'), 'utf8')

const normalizedHtml = {
  language: capture(html, /<html[^>]*\blang="([^"]+)"/i, 'document language'),
  title: capture(html, /<title>([^<]+)<\/title>/i, 'title'),
  description: capture(
    html,
    /<meta\s+name="description"\s+content="([^"]+)"/i,
    'description',
  ),
  themeColor: capture(
    html,
    /<meta\s+name="theme-color"\s+content="([^"]+)"/i,
    'theme colour',
  ),
  favicon: capture(
    html,
    /<link\s+rel="icon"\s+href="([^"]+)"\s+sizes="any"/i,
    'favicon',
  ),
  logo: capture(
    html,
    /<link\s+rel="icon"\s+href="([^"]+)"\s+type="image\/svg\+xml"/i,
    'logo',
  ),
  appleTouchIcon: capture(
    html,
    /<link\s+rel="apple-touch-icon"\s+href="([^"]+)"/i,
    'apple touch icon',
  ),
}

assert.deepEqual(manifest, baseline.manifest, 'Default PWA manifest changed from the P14 baseline.')
assert.deepEqual(
  normalizedHtml,
  baseline.html,
  'Default HTML metadata changed from the P14 baseline.',
)
assert.equal(
  serviceWorker.includes('experiences/'),
  false,
  'Default service worker precaches another experience.',
)

console.log('Default build manifest, HTML metadata and precache isolation match the P14 baseline.')
