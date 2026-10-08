import { expect, test } from '@playwright/test'

import { expectNoAxeViolations, expectNoDocumentHorizontalOverflow } from '../helpers/accessibility'

const forbiddenVocabulary =
  /\b(?:sanofi|course|lesson|learning path|training module|curriculum|learning objective|complete lesson|certification|course progress|continue learning|assessment|pass|fail|grade|learning outcome|course completed|xp)\b/i

test('boots the isolated game hub with clean metadata, storage and copy', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Respiratory Challenge' })).toBeVisible()
  await expect(page.getByText('Autovrse LevelUp')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start a quick challenge' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-experience', 'sanofi')
  await expect(page.locator('nav.fixed.bottom-0')).toHaveCount(1)
  await expect(page.getByLabel('Learner status')).toHaveCount(0)
  await expect(page.getByLabel('Best score 0')).toBeVisible()
  await expect(page.getByText('Install Learning App')).toHaveCount(0)

  const manifest = await page.request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  expect(await manifest.json()).toMatchObject({
    name: 'Autovrse LevelUp',
    theme_color: '#0f766e',
    background_color: '#071b1e',
  })

  const keys = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('keyval-store')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const names = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = database.transaction('keyval').objectStore('keyval').getAllKeys()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return {
      indexedDb: names.map(String),
      localStorage: Object.keys(localStorage),
    }
  })
  expect(keys.indexedDb).toContain('axiom-runtime:sanofi:learner')
  expect(keys.indexedDb).not.toContain('axiom-runtime:learner')
  expect(keys.localStorage.every((key) => key.startsWith('axiom-runtime:sanofi:'))).toBe(true)

  const visibleText = await page.locator('body').innerText()
  expect(visibleText).not.toMatch(forbiddenVocabulary)
  await expectNoDocumentHorizontalOverflow(page, 'sanofi hub')
  await expectNoAxeViolations(page, 'sanofi hub')

  await page.goto('/not-a-route')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Return to play' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})
