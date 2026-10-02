import type { AppConfig } from '@/content/schema'

export type ConfettiMoment =
  AppConfig['product']['presentation']['confetti']['moments'][number]

const played = new Set<string>()

export async function playConfetti(
  moment: ConfettiMoment,
  key: string,
  config: AppConfig['product']['presentation']['confetti'],
  reducedMotion: boolean,
) {
  if (
    reducedMotion ||
    (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) ||
    played.has(key) ||
    !config.moments.includes(moment) ||
    config.particleCount === 0
  ) {
    return
  }

  played.add(key)
  const { default: confetti } = await import('canvas-confetti')
  confetti({
    particleCount: config.particleCount,
    spread: 68,
    startVelocity: 34,
    origin: { y: 0.72 },
    disableForReducedMotion: true,
    colors: ['#168573', '#7458d6', '#d89914', '#2a84b8'],
  })
}

export function resetConfettiForTests() {
  played.clear()
}
