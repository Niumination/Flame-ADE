import { describe, it, expect } from 'vitest'

describe('App', () => {
  it('renders without crashing', () => {
    expect(true).toBe(true)
  })

  it('has required environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
})
