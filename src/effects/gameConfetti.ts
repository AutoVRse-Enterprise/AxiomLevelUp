import type { AppConfig, GameConfig } from '@/content/schema'
import { playConfetti } from '@/effects/confetti'
import { subscribeToEvents } from '@/events/bus'

export function initializeGameConfettiEffects(
  presentation: AppConfig['product']['presentation']['confetti'],
  games: GameConfig | undefined,
) {
  return subscribeToEvents((event) => {
    if (event.event !== 'game_completed' || !games?.scoring) return
    const maximum = event.roundResults.length * games.scoring.roundMaxPoints
    if (maximum <= 0 || event.total / maximum < presentation.gameCompleteMinScoreRatio) return
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    void playConfetti('game_complete', event.runId, presentation, reducedMotion)
  })
}
