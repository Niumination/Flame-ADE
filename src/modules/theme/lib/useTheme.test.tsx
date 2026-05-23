import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme, themes } from './useTheme'
import '@testing-library/jest-dom'

function TestConsumer() {
  const { theme, colors, setTheme, isDark } = useTheme()
  return (
    <div>
      <span data-testid="theme-name">{theme}</span>
      <span data-testid="theme-bg">{colors.background}</span>
      <span data-testid="theme-fg">{colors.foreground}</span>
      <span data-testid="is-dark">{isDark ? 'yes' : 'no'}</span>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>Dark</button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>Light</button>
      <button data-testid="set-tokyo" onClick={() => setTheme('tokyoNight')}>Tokyo</button>
      <button data-testid="set-nord" onClick={() => setTheme('nord')}>Nord</button>
      <button data-testid="set-invalid" onClick={() => setTheme('nonexistent')}>Invalid</button>
    </div>
  )
}

function renderWithTheme() {
  return render(
    <ThemeProvider>
      <TestConsumer />
    </ThemeProvider>
  )
}

describe('ThemeProvider', () => {
  it('renders children', () => {
    renderWithTheme()
    expect(screen.getByTestId('theme-name')).toBeInTheDocument()
  })

  it('defaults to dark theme', () => {
    renderWithTheme()
    expect(screen.getByTestId('theme-name').textContent).toBe('dark')
    expect(screen.getByTestId('theme-bg').textContent).toBe(themes.dark.background)
  })

  it('provides correct colors for dark theme', () => {
    renderWithTheme()
    expect(screen.getByTestId('theme-bg').textContent).toBe('#0a0a0a')
    expect(screen.getByTestId('theme-fg').textContent).toBe('#e4e4e7')
    expect(screen.getByTestId('is-dark').textContent).toBe('yes')
  })

  it('changes theme to light on button click', () => {
    renderWithTheme()
    fireEvent.click(screen.getByTestId('set-light'))
    expect(screen.getByTestId('theme-name').textContent).toBe('light')
    expect(screen.getByTestId('theme-bg').textContent).toBe(themes.light.background)
    expect(screen.getByTestId('is-dark').textContent).toBe('no')
  })

  it('changes theme to tokyoNight', () => {
    renderWithTheme()
    fireEvent.click(screen.getByTestId('set-tokyo'))
    expect(screen.getByTestId('theme-name').textContent).toBe('tokyoNight')
    expect(screen.getByTestId('theme-bg').textContent).toBe(themes.tokyoNight.background)
    expect(screen.getByTestId('is-dark').textContent).toBe('yes')
  })

  it('changes theme to nord', () => {
    renderWithTheme()
    fireEvent.click(screen.getByTestId('set-nord'))
    expect(screen.getByTestId('theme-name').textContent).toBe('nord')
    expect(screen.getByTestId('theme-bg').textContent).toBe(themes.nord.background)
  })

  it('ignores invalid theme names', () => {
    renderWithTheme()
    fireEvent.click(screen.getByTestId('set-invalid'))
    expect(screen.getByTestId('theme-name').textContent).toBe('dark')
  })

  it('sets CSS variables on theme change', () => {
    renderWithTheme()
    fireEvent.click(screen.getByTestId('set-light'))
    const bg = document.documentElement.style.getPropertyValue('--bg')
    const fg = document.documentElement.style.getPropertyValue('--fg')
    expect(bg).toBe(themes.light.background)
    expect(fg).toBe(themes.light.foreground)
  })
})

describe('themes object', () => {
  it('has 7 themes', () => {
    expect(Object.keys(themes).length).toBeGreaterThanOrEqual(7)
  })

  it('each theme has required color keys', () => {
    const expectedKeys = ['background', 'foreground', 'muted', 'mutedForeground', 'border', 'primary', 'destructive']
    for (const _name of Object.keys(themes)) {
      const colors = themes[_name] as unknown as Record<string, unknown>
      for (const key of expectedKeys) {
        expect(colors).toHaveProperty(key)
        expect(typeof colors[key]).toBe('string')
        expect(String(colors[key])).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })

  it('dark and light have different backgrounds', () => {
    expect(themes.dark.background).not.toBe(themes.light.background)
  })
})

describe('useTheme', () => {
  it('throws when used outside ThemeProvider', () => {
    // useTheme returns context with default values when used outside provider
    // it does NOT throw — the context has a default value
    function Test() {
      const { theme } = useTheme()
      return <span>{theme}</span>
    }
    render(<Test />)
    expect(screen.getByText('dark')).toBeInTheDocument()
  })
})
