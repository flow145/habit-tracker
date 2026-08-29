import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeStore {
  themePreference: ThemePreference
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (): ThemeStore => ({
      themePreference: 'system',
    }),
    { name: 'habit-tracker-theme' },
  ),
)

export const setThemePreference = (themePreference: ThemePreference) => {
  useThemeStore.setState({ themePreference })
}
