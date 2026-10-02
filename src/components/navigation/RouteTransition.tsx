import { AnimatePresence, m } from 'motion/react'
import { useEffect } from 'react'
import { useLocation, useOutlet } from 'react-router'

export function RouteTransition() {
  const location = useLocation()
  const outlet = useOutlet()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('#main-content h1')
      if (!heading) return
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.pathname])

  return (
    <AnimatePresence initial={false} mode="wait">
      <m.div
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        initial={{ opacity: 0, y: 6 }}
        key={location.pathname}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  )
}
