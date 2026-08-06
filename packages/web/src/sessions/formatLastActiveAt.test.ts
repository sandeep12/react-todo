import { describe, expect, it } from 'vitest'

import { formatLastActiveAt } from './formatLastActiveAt'

describe('formatLastActiveAt', () => {
  it('formats a valid ISO timestamp', () => {
    const formatted = formatLastActiveAt('2026-01-01T12:00:00.000Z')

    expect(formatted).toMatch(/2026/)
    expect(formatted).toMatch(/12/)
  })

  it('returns the original value for invalid timestamps', () => {
    expect(formatLastActiveAt('not-a-date')).toBe('not-a-date')
  })
})
