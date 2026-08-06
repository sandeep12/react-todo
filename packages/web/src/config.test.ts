import { describe, expect, it } from 'vitest'

import { API_BASE_URL } from './config'

describe('API_BASE_URL', () => {
  it('falls back to the local API origin when VITE_API_URL is unset', () => {
    expect(API_BASE_URL).toBe('http://localhost:3000')
  })
})
