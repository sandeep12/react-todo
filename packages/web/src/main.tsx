import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Unable to mount the app: no element with id "root" was found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
