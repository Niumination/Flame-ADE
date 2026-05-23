import React, { createContext, useContext, useState, useCallback } from 'react'

export type ColorScheme = 'dark' | 'light'

export interface ThemeColors {
  background: string
  foreground: string
  muted: string
  mutedForeground: string
  border: string
  primary: string
  destructive: string
}

export const themes: Record<string, ThemeColors> = {
  dark: {
    background: '#0a0a0a',
    foreground: '#e4e4e7',
    muted: '#27272a',
    mutedForeground: '#a1a1aa',
    border: '#27272a',
    primary: '#3b82f6',
    destructive: '#ef4444',
  },
  light: {
    background: '#ffffff',
    foreground: '#09090b',
    muted: '#f4f4f5',
    mutedForeground: '#71717a',
    border: '#e4e4e7',
    primary: '#3b82f6',
    destructive: '#ef4444',
  },
  tokyoNight: {
    background: '#1a1b26',
    foreground: '#a9b1d6',
    muted: '#24283b',
    mutedForeground: '#565f89',
    border: '#32344a',
    primary: '#7aa2f7',
    destructive: '#f7768e',
  },
  nord: {
    background: '#2e3440',
    foreground: '#d8dee9',
    muted: '#3b4252',
    mutedForeground: '#4c566a',
    border: '#434c5e',
    primary: '#81a1c1',
    destructive: '#bf616a',
  },
  dracula: {
    background: '#282a36',
    foreground: '#f8f8f2',
    muted: '#44475a',
    mutedForeground: '#6272a4',
    border: '#44475a',
    primary: '#bd93f9',
    destructive: '#ff5555',
  },
  catppuccin: {
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    muted: '#313244',
    mutedForeground: '#6c7086',
    border: '#45475a',
    primary: '#89b4fa',
    destructive: '#f38ba8',
  },
  oneDark: {
    background: '#1e2127',
    foreground: '#abb2bf',
    muted: '#2c323c',
    mutedForeground: '#565c64',
    border: '#3b4048',
    primary: '#61afef',
    destructive: '#e06c75',
  },
}

interface ThemeContextValue {
  theme: string
  colors: ThemeColors
  setTheme: (name: string) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  colors: themes.dark,
  setTheme: () => {},
  isDark: true,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState('dark')
  const colors = themes[theme] || themes.dark
  const isDark = theme === 'dark' || theme === 'tokyoNight' || theme === 'nord' || theme === 'dracula' || theme === 'catppuccin' || theme === 'oneDark'

  const setTheme = useCallback((name: string) => {
    if (themes[name]) {
      setThemeState(name)
      document.documentElement.style.setProperty('--bg', themes[name].background)
      document.documentElement.style.setProperty('--fg', themes[name].foreground)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
