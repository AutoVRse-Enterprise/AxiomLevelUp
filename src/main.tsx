import '@fontsource-variable/inter'
import '@/styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

function App() {
  return <main>Learning Runtime</main>
}

const root = document.getElementById('root')

if (!root) {
  throw new Error('Application root element was not found.')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
