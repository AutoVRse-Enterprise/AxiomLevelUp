import { useEffect, useState } from 'react'

/* eslint-disable react-refresh/only-export-components -- The imperative announcer feeds this mounted live region. */

import { subscribeToEvents } from '@/events/bus'

const presentationSubscribers = new Set<(message: string) => void>()

export function announcePresentation(message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('presentation-announcement', { detail: message }))
  }
  presentationSubscribers.forEach((subscriber) => subscriber(message))
}

export function PresentationAnnouncer() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    presentationSubscribers.add(setMessage)
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
      presentationSubscribers.delete(setMessage)
    }
  }, [])

  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only">
      {message}
    </div>
  )
}
