import type { Entry, ExplicitStatus, Schedule } from '~/shared/api'
import { Day } from '~/shared/lib'

type DerivedStatus = 'incomplete' | 'not-required'

export type ComputedStatus = ExplicitStatus | DerivedStatus

export const getNextStatus = (status: ComputedStatus) =>
  status === 'complete' ? 'incomplete' : 'complete'

export interface ComputedEntry {
  day: Day
  status: ComputedStatus
}

export const getWindowEnd = (day: Day, { interval, intervalUnit }: Schedule) =>
  day.add({ [intervalUnit]: interval }).subtract({ days: 1 })

export const getWindowStart = (day: Day, { interval, intervalUnit }: Schedule) =>
  day.add({ days: 1 }).subtract({ [intervalUnit]: interval })

export const buildComputedEntries = ({
  start,
  end,
  entries,
  schedule,
}: {
  start: Day
  end: Day
  entries: Record<string, Pick<Entry, 'day' | 'status'>>
  schedule: Schedule
}): ComputedEntry[] => {
  const dayCount = end.differenceInDays(start) + 1
  if (dayCount < 1) return []

  const effectiveStart = getWindowStart(start, schedule)

  let completedCount = 0
  let windowStart = effectiveStart
  let windowEnd = getWindowEnd(windowStart, schedule)
  let windowStartIndex = 0
  let windowEndIndex = -1

  const computedEntries: ComputedEntry[] = Day.eachDayOfInterval(effectiveStart, end).map(
    (day) => ({ day, status: 'incomplete' }),
  )

  // Accumulating phase: count completed days for the first sliding window
  for (let day = windowStart; day <= windowEnd && day <= end; day = day.add({ days: 1 })) {
    if (entries[day.value]?.status === 'complete') completedCount += 1
    windowEndIndex += 1
  }

  // Sliding window phase: advance one calendar day at a time
  while (windowStart < end) {
    const windowStartExplicitStatus = entries[windowStart.value]?.status

    if (windowStartExplicitStatus === 'complete' && completedCount >= schedule.frequency)
      for (let i = windowStartIndex; i <= windowEndIndex; i += 1) {
        const computedEntry = computedEntries[i]
        if (computedEntry) computedEntry.status = 'not-required'
      }

    if (windowStartExplicitStatus === 'complete') completedCount -= 1
    windowStart = windowStart.add({ days: 1 })
    windowStartIndex += 1

    const nextWindowEnd = getWindowEnd(windowStart, schedule)
    Day.eachDayOfInterval(windowEnd, nextWindowEnd)
      .slice(1)
      .forEach((day) => {
        if (entries[day.value]?.status === 'complete') completedCount += 1
        windowEndIndex += 1
      })
    windowEnd = nextWindowEnd
  }

  // Explicit completions override derived statuses
  computedEntries.forEach((computedEntry) => {
    const explicitStatus = entries[computedEntry.day.value]?.status
    if (explicitStatus) computedEntry.status = explicitStatus
  })

  return computedEntries.slice(-dayCount)
}
