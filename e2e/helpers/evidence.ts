import { mkdirSync } from 'node:fs'
import path from 'node:path'

import type { Page, TestInfo } from '@playwright/test'

const evidenceRoot = path.resolve('docs/qa/evidence/phase-12')

export function evidenceViewport(testInfo: TestInfo) {
  return testInfo.project.name === 'touch-phone-chromium' ? '375px' : 'desktop'
}

export async function capturePhase12Evidence(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fullPage = true,
) {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  )
  const directory = path.join(evidenceRoot, evidenceViewport(testInfo))
  mkdirSync(directory, { recursive: true })
  await page.screenshot({
    path: path.join(directory, `${name}.png`),
    fullPage,
    animations: 'disabled',
  })
}
