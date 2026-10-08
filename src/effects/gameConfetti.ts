import type { AppConfig, GameConfig } from '@/content/schema'
import { playConfetti } from '@/effects/confetti'
import { subscribeToEvents } from '@/events/bus'

export function initializeGameConfettiEffects(
  presentation: AppConfig['product']['presentation']['confetti'],
  games: GameConfig | undefined,
) {
  return subscribeToEvents((event) => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (event.event === 'game_personal_best') {
      void playConfetti(
        'game_personal_best',
        `${event.runId}:personal-best`,
        presentation,
        reducedMotion,
      )
      return
    }
    if (event.event === 'game_rank_improved') {
      void playConfetti('game_rank_up', `${event.runId}:rank`, presentation, reducedMotion)
      return
    }
    if (event.event !== 'game_completed' || !games?.scoring) return
    const maximum = event.roundResults.length * games.scoring.roundMaxPoints
    if (maximum <= 0 || event.total / maximum < presentation.gameCompleteMinScoreRatio) return
    void playConfetti('game_complete', event.runId, presentation, reducedMotion)
  })
}
