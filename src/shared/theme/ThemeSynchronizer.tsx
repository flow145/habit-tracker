import { useLayoutEffect } from 'react'

import type { ThemePreference } from './store'
import { useThemeStore } from './store'

const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'

const resolveTheme = (preference: ThemePreference, prefersDark: boolean) => {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

const applyTheme = (theme: 'light' | 'dark') => {
  const root = document.documentElement

  if (theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
}

export const ThemeSynchronizer = () => {
  const themePreference = useThemeStore((state) => state.themePreference)

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(DARK_MODE_QUERY)
    const updateTheme = () => applyTheme(resolveTheme(themePreference, mediaQuery.matches))

    updateTheme()

    if (themePreference !== 'system') return

    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [themePreference])

  return null
}
