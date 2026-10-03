import { expect, type Locator, type Page } from '@playwright/test'
import axe from 'axe-core'

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

interface AxeViolation {
  id: string
  impact: string | null
  help: string
  nodes: Array<{ target: string[]; failureSummary?: string }>
}

export async function expectNoAxeViolations(page: Page, state: string) {
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(async () => {
    await Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.playState !== 'finished')
          .map((animation) => animation.finished.catch(() => undefined)),
      ),
      new Promise((resolve) => window.setTimeout(resolve, 750)),
    ])
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
  })
  const hasAxe = await page.evaluate(() => 'axe' in window)
  if (!hasAxe) await page.addScriptTag({ content: axe.source })
  const violations = await page.evaluate(async (tags) => {
    const axeApi = (
      window as typeof window & {
        axe: {
          run(
            context: Document | HTMLElement,
            options: { runOnly: { type: 'tag'; values: string[] } },
          ): Promise<{ violations: AxeViolation[] }>
        }
      }
    ).axe
    const dialog = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].find(
      (element) => element.getClientRects().length > 0,
    )
    return (await axeApi.run(dialog ?? document, { runOnly: { type: 'tag', values: tags } }))
      .violations
  }, wcagTags)

  expect(
    violations,
    `${state}\n${violations
      .map(
        (violation) =>
          `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help}\n${violation.nodes
            .map((node) => `  ${node.target.join(' ')}: ${node.failureSummary ?? ''}`)
            .join('\n')}`,
      )
      .join('\n')}`,
  ).toEqual([])
}

export async function applyTwoHundredPercentText(page: Page) {
  await page.addStyleTag({
    content: `
      html {
        font-size: 200% !important;
      }
    `,
  })
  await page.evaluate(() => document.fonts.ready)
}

export async function expectNoDocumentHorizontalOverflow(page: Page, state: string) {
  const dimensions = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth
    return {
      clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.right > clientWidth + 1 || rect.left < -1
        })
        .slice(0, 8)
        .map((element) => ({
          element: element.outerHTML.slice(0, 240),
          left: element.getBoundingClientRect().left,
          right: element.getBoundingClientRect().right,
        })),
    }
  })
  expect(
    dimensions.scrollWidth,
    `${state} must not create document-level horizontal overflow\n${JSON.stringify(dimensions.offenders, null, 2)}`,
  ).toBeLessThanOrEqual(dimensions.clientWidth)
}

export async function expectReachable(locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  await expect(locator).toBeVisible()
  await expect(locator).toBeEnabled()
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  const viewport = locator.page().viewportSize()
  expect(viewport).not.toBeNull()
  expect(box!.x + box!.width).toBeGreaterThan(0)
  expect(box!.x).toBeLessThan(viewport!.width)
  expect(box!.y + box!.height).toBeGreaterThan(0)
  expect(box!.y).toBeLessThan(viewport!.height)
}

export async function expectVisibleKeyboardFocus(page: Page) {
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement !== document.body)) break
  }
  const focused = page.locator(':focus-visible')
  await expect(focused).toHaveCount(1)
  await expect(focused).toBeVisible()
  const focusStyle = await focused.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      boxShadow: style.boxShadow,
    }
  })
  expect(
    focusStyle.outlineStyle !== 'none' ||
      focusStyle.outlineWidth > 0 ||
      focusStyle.boxShadow !== 'none',
  ).toBe(true)
}
