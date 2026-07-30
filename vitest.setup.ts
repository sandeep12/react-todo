import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library auto-cleans between tests when globals are enabled,
// but we register it explicitly so the harness is not dependent on that.
afterEach(() => {
  cleanup()
})
