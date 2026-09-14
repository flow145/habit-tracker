import { create } from 'zustand'

import type { Entry, Habit } from '~/shared/db'

export type HydrationStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface HabitStore {
  hydrationStatus: HydrationStatus
  hydrationError: Error | null
  habitsById: Record<string, Habit>
  /** Ordered by creation date newest last */
  habitIds: string[]
  entriesByHabitId: Record<string, Record<string, Entry>>
}

export const getDayKey = (day: Date) => day.toISOString()

export const useHabitStore = create<HabitStore>()(() => ({
  hydrationStatus: 'idle',
  hydrationError: null,
  habitsById: {},
  habitIds: [],
  entriesByHabitId: {},
}))
