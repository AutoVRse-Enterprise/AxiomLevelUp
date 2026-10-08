import { useContent } from '@/app/contentContext'
import { GameHub } from '@/components/game/GameHub'

export function HomePage() {
  const { appConfig } = useContent()
  const hub = appConfig.games?.hub
  if (!hub) throw new Error('Game hub configuration is missing.')

  return <GameHub />
}
