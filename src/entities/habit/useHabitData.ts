import { useMemo } from 'react'

import { Day, useCurrentDay } from '~/shared/lib'

import { buildComputedEntries, type ComputedEntry } from './computed-entries'
import { type EntriesByDay, useHabitStore } from './store'
import { calculateStrength } from './strength'

const EMPTY_ENTRIES: EntriesByDay = {}
const EMPTY_DATA: { computedEntries: ComputedEntry[]; strengths: number[] } = {
  computedEntries: [],
  strengths: [],
}

export const useHabitData = (habitId: string) => {
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)
  const schedule = useHabitStore((state) => state.habitsById[habitId]?.schedule)
  const entries = useHabitStore((state) => state.entriesByHabitId[habitId] ?? EMPTY_ENTRIES)
  const today = useCurrentDay()

  return useMemo(() => {
    if (!schedule || hydrationStatus !== 'ready') return EMPTY_DATA

    const entryDays = Object.values(entries)
      .map(({ day }) => day)
      .filter((day) => day <= today.value)

    if (entryDays.length === 0) return EMPTY_DATA

    const start = new Day(entryDays.reduce((earliest, day) => (day < earliest ? day : earliest)))

    const computedEntries = buildComputedEntries({ start, end: today, entries, schedule })
    const strengths = calculateStrength(computedEntries, schedule)

    return { computedEntries, strengths }
  }, [schedule, entries, hydrationStatus, today])
}
