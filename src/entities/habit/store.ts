import { create } from 'zustand'

import type { Entry, Habit } from '~/shared/api'

export type HydrationStatus = 'idle' | 'loading' | 'ready' | 'error'

export type EntriesByDay = Record<string, Entry>

export interface HabitState {
  hydrationStatus: HydrationStatus
  hydrationError: Error | null
  /** In the order supplied by the repository, with new Habits appended. */
  habits: Habit[]
  habitsById: Record<string, Habit>
  entriesByHabitId: Record<string, EntriesByDay>
}

export const createHabitState = (): HabitState => ({
  hydrationStatus: 'idle',
  hydrationError: null,
  habits: [],
  habitsById: {},
  entriesByHabitId: {},
})

export const useHabitStore = create<HabitState>()(createHabitState)
