import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
  type GameSession,
  isIncompleteGameSession,
  sessionMatchesGame,
} from '@/engines/games/session'
import { idbStorage } from '@/state/persistence/idbStorage'

export const GAME_SESSION_VERSION = 1

interface GameSessionStore {
  session: GameSession | null
  save: (session: GameSession) => void
  loadForGame: (gameId: string, gameVersion: string) => GameSession | null
  clear: () => void
}

export const useGameSessionStore = create<GameSessionStore>()(
  persist(
    (set, get) => ({
      session: null,
      save: (session) => set({ session }),
      loadForGame: (gameId, gameVersion) => {
        const current = get().session
        if (
          current &&
          sessionMatchesGame(current, gameId, gameVersion) &&
          isIncompleteGameSession(current)
        ) {
          const normalized = {
            ...current,
            rounds: current.rounds.map((round) => ({
              ...round,
              roundStep: round.roundStep ?? ('explore' as const),
              exploreDraft: round.exploreDraft ?? null,
              skipped: round.skipped ?? false,
            })),
          }
          if (normalized !== current) set({ session: normalized })
          return normalized
        }
        if (current) set({ session: null })
        return null
      },
      clear: () => set({ session: null }),
    }),
    {
      name: 'game-session',
      version: GAME_SESSION_VERSION,
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      partialize: ({ session }) => ({ session }),
    },
  ),
)

export type { GameSessionStore }
