import { Play } from 'lucide-react'

import { useContent } from '@/app/contentContext'
import { Button, Card, Chip } from '@/components/ui'

export function HomePage() {
  const { appConfig } = useContent()
  const hub = appConfig.games?.hub
  if (!hub) throw new Error('Game hub configuration is missing.')

  return (
    <section className="mx-auto grid min-h-[60svh] max-w-4xl place-items-center py-8 sm:py-14">
      <Card className="w-full overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-7 text-white sm:p-12">
        <Chip className="border-white/20 bg-white/10 text-white">Quick play</Chip>
        <h1 className="mt-5 max-w-2xl text-display font-bold text-balance">{hub.title}</h1>
        <p className="mt-4 max-w-xl text-lg text-brand-100">{hub.tagline}</p>
        <Button className="mt-8" disabled leadingIcon={<Play aria-hidden="true" />} size="lg">
          {hub.startLabel}
        </Button>
        <p className="mt-3 text-small font-semibold text-brand-200">{hub.unavailableLabel}</p>
      </Card>
    </section>
  )
}
