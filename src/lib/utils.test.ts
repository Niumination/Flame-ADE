import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('filters falsy values', () => {
    expect(cn('a', false && 'b', undefined, null, 0, 'c')).toBe('a c')
  })

  it('handles single class', () => {
    expect(cn('only')).toBe('only')
  })

  it('handles empty input', () => {
    expect(cn()).toBe('')
  })

  it('handles conditional classes with ternary', () => {
    const active = true
    expect(cn('base', active ? 'active' : 'inactive')).toBe('base active')
  })

  it('handles all falsy', () => {
    expect(cn(false, undefined, null, 0, '')).toBe('')
  })
})
