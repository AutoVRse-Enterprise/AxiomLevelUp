import { useEffect, useState } from 'react'

import { subscribeToEvents } from '@/events/bus'

export function PresentationAnnouncer() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToEvents((event) => {
        if (event.event === 'xp_awarded') setMessage(`${event.amount} experience points earned`)
        if (event.event === 'badge_unlocked') setMessage('New achievement unlocked')
        if (event.event === 'level_up') setMessage(`Level ${event.to} reached`)
        if (event.event === 'streak_updated') {
          setMessage(`${event.currentDays} day learning streak`)
        }
      })
    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}
