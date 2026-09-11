import type { Entry, Habit } from '~/shared/db'

import { buildComputedEntries, type ComputedEntry } from './computed-entries'
import { getEntryKey, type HabitStore } from './store'

export interface DateRange {
  start: Date
  end: Date
}

export interface HabitWithComputedEntries extends Habit {
  computedEntries: ComputedEntry[]
}

export const selectHabitIds = (state: HabitStore) => state.habitIds

export const selectHabit = (state: HabitStore, habitId: string | undefined): Habit | null =>
  habitId ? (state.habitsById[habitId] ?? null) : null

const getHabitEntries = (state: HabitStore, habitId: string) =>
  Object.values(state.entriesByHabitDay).filter((entry) => entry.habitId === habitId)

const haveSameEntries = (first: Entry[] | null, second: Entry[]) => {
  if (!first || first.length !== second.length) return false
  return first.every((entry, index) => entry === second[index])
}

export const createHabitSelector = (habitId: string, range: DateRange) => {
  let previousHabit: Habit | null = null
  let previousEntries: Entry[] | null = null
  let previousStart = Number.NaN
  let previousEnd = Number.NaN
  let previousResult: HabitWithComputedEntries | null = null

  return (state: HabitStore): HabitWithComputedEntries | null => {
    const habit = state.habitsById[habitId] ?? null
    if (!habit) return null

    const entries = getHabitEntries(state, habitId)
    const start = range.start.getTime()
    const end = range.end.getTime()

    if (
      previousResult &&
      previousHabit === habit &&
      haveSameEntries(previousEntries, entries) &&
      previousStart === start &&
      previousEnd === end
    ) {
      return previousResult
    }

    previousHabit = habit
    previousEntries = entries
    previousStart = start
    previousEnd = end
    previousResult = {
      ...habit,
      computedEntries: buildComputedEntries({
        start: range.start,
        end: range.end,
        entries,
        schedule: habit.schedule,
      }),
    }

    return previousResult
  }
}

export const selectHabitWithComputedEntries = (
  state: HabitStore,
  habitId: string,
  range: DateRange,
) => createHabitSelector(habitId, range)(state)

export { getEntryKey }
