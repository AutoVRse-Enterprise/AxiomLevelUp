import '@fontsource-variable/inter'
import '@/styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/app/App'
import { emitEvent } from '@/events/bus'
import { initializeEventLogging } from '@/events/eventLogStore'
import { registerServiceWorker } from '@/pwa/registerSW'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Application root element was not found.')
}

initializeEventLogging()
emitEvent({ event: 'app_opened', source: 'client' })
registerServiceWorker()

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
