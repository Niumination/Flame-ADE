import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeProvider'
import { listBuiltinThemes, getBuiltinTheme, getDefaultTheme } from './themes'
import { DEFAULT_THEME_ID } from './types'
import '@testing-library/jest-dom'

function TestConsumer() {
  const { mode, resolvedMode, themeId, setMode, setThemeId } = useTheme()
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved-mode">{resolvedMode}</span>
      <span data-testid="theme-id">{themeId}</span>
      <button data-testid="set-dark" onClick={() => setMode('dark')}>Dark</button>
      <button data-testid="set-light" onClick={() => setMode('light')}>Light</button>
      <button data-testid="set-theme" onClick={() => setThemeId('tokyo-night')}>Tokyo</button>
    </div>
  )
}

function renderWithTheme() {
  return render(
    <ThemeProvider defaultMode="dark">
      <TestConsumer />
    </ThemeProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('ThemeProvider', () => {
  it('renders children', () => {
    renderWithTheme()
    expect(screen.getByTestId('mode')).toBeInTheDocument()
  })

  it('defaults to dark mode', () => {
    renderWithTheme()
    expect(screen.getByTestId('mode').textContent).toBe('dark')
    expect(screen.getByTestId('theme-id').textContent).toBe(DEFAULT_THEME_ID)
  })

  it('changes mode to light', () => {
    renderWithTheme()
    fireEvent.click(screen.getByTestId('set-light'))
    expect(screen.getByTestId('mode').textContent).toBe('light')
  })

  it('changes theme id', () => {
    renderWithTheme()
    expect(screen.getByTestId('theme-id').textContent).toBe(DEFAULT_THEME_ID)
    fireEvent.click(screen.getByTestId('set-theme'))
    expect(screen.getByTestId('theme-id').textContent).toBe('tokyo-night')
  })

  it('persists theme selection to localStorage', () => {
    renderWithTheme()
    fireEvent.click(screen.getByTestId('set-light'))
    expect(localStorage.getItem('flame-ade:theme-mode')).toBe('"light"')
  })

  it('sets CSS class on root element', () => {
    renderWithTheme()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    fireEvent.click(screen.getByTestId('set-light'))
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('useTheme', () => {
  it('throws when used outside ThemeProvider', () => {
    function Test() {
      useTheme()
      return null
    }
    expect(() => render(<Test />)).toThrow('useTheme must be used within a <ThemeProvider>')
  })
})

describe('bridge exports', () => {
  it('supports Theme colors for backward compat', () => {
    const themes = listBuiltinThemes()
    expect(themes.length).toBeGreaterThanOrEqual(10)
    const tsTheme = themes.find(t => t.id === 'tokyo-night')
    expect(tsTheme).toBeDefined()
    expect(tsTheme!.name).toBe('Tokyo Night')
    expect(tsTheme!.variants.dark?.colors?.background).toBe('#1a1b26')
  })

  it('getBuiltinTheme finds themes by id', () => {
    const theme = getBuiltinTheme('nord')
    expect(theme).toBeDefined()
    expect(theme!.name).toBe('Nord')
  })

  it('getDefaultTheme returns terax-default', () => {
    const theme = getDefaultTheme()
    expect(theme.id).toBe(DEFAULT_THEME_ID)
  })
})
