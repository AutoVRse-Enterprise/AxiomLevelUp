import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { chromium } from '@playwright/test'

const url =
  process.env.SPATIAL_CUE_URL ?? 'http://127.0.0.1:5191/src/spikes/spatial-rounds/production.html'
const outputPath = resolve(process.cwd(), 'docs/qa/evidence/phase-17/spatial-cue-performance.json')
const browser = await chromium.launch({
  headless: true,
  args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader'],
})

try {
  const page = await browser.newPage({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    hasTouch: true,
    isMobile: true,
  })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(
    () => (window as Window & { spatialCueSnapshot?: unknown }).spatialCueSnapshot !== undefined,
  )
  await page.waitForTimeout(2_500)
  const snapshot = await page.evaluate(
    () => (window as Window & { spatialCueSnapshot?: unknown }).spatialCueSnapshot,
  )
  const evidence = {
    capturedAt: new Date().toISOString(),
    viewport: { width: 375, height: 812, deviceScaleFactor: 1 },
    launch: 'Chromium ANGLE SwiftShader',
    snapshot,
  }
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)

  const result = snapshot as {
    performance?: { medianFps?: number | null; sampleCount?: number }
    renderer?: { unmaskedRenderer?: string | null }
  }
  if ((result.performance?.sampleCount ?? 0) < 60) throw new Error('Insufficient frame samples.')
  if ((result.performance?.medianFps ?? 0) < 20) throw new Error('Median FPS fell below 20.')
  if (!result.renderer?.unmaskedRenderer?.toLowerCase().includes('swiftshader')) {
    throw new Error(
      `Expected SwiftShader, received ${result.renderer?.unmaskedRenderer ?? 'unknown'}.`,
    )
  }
  console.log(
    `Spatial cue audit passed: ${result.performance?.medianFps?.toFixed(1)} fps on ${result.renderer.unmaskedRenderer}.`,
  )
} finally {
  await browser.close()
}
