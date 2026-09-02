import { add, differenceInCalendarDays, eachDayOfInterval, format, min, sub } from 'date-fns'

import type { Entry, Schedule, Status } from '~/shared/db'

export type ComputedStatus = Status | 'incomplete' | 'not-required'
type CalendarDate = `${number}-${number}-${number}`

export interface ComputedEntry {
  day: Date
  status: ComputedStatus
}

const toCalendarDate = (date: Date) => format(date, 'yyyy-MM-dd') as CalendarDate

export const getWindowEnd = (date: Date, { interval, intervalUnit }: Schedule) => {
  const firstDayAfterWindow = add(date, { [intervalUnit]: interval })
  return sub(firstDayAfterWindow, { days: 1 })
}

export const getWindowStart = (date: Date, { interval, intervalUnit }: Schedule) => {
  const firstDayAfterWindow = add(date, { days: 1 })
  return sub(firstDayAfterWindow, { [intervalUnit]: interval })
}

export const buildComputedEntries = ({
  start,
  end,
  entries,
  schedule,
}: {
  start: Date
  end: Date
  entries: Pick<Entry, 'day' | 'status'>[]
  schedule: Schedule
}): ComputedEntry[] => {
  const dayCount = differenceInCalendarDays(end, start) + 1
  if (dayCount < 1) return []

  const effectiveStart = getWindowStart(start, schedule)

  const statusByDate = new Map(entries.map((entry) => [toCalendarDate(entry.day), entry.status]))

  let completedCount = 0
  let windowStart = effectiveStart
  let windowEnd = getWindowEnd(windowStart, schedule)
  let windowStartIndex = 0
  let windowEndIndex = -1

  const computedEntries: ComputedEntry[] = eachDayOfInterval({
    start: effectiveStart,
    end,
  }).map((date) => ({
    day: date,
    status: 'incomplete',
  }))

  // Accumulating phase: count completed days for the first sliding window
  for (
    let date = windowStart;
    differenceInCalendarDays(min([windowEnd, end]), date) >= 0;
    date = add(date, { days: 1 })
  ) {
    if (statusByDate.get(toCalendarDate(date)) === 'complete') completedCount += 1
    windowEndIndex += 1
  }

  // Sliding window phase: advance the window start one day at a time,
  // recalculate the window end and completed count, and assign not-required statuses
  while (differenceInCalendarDays(end, windowStart) >= 1) {
    const windowStartExplicitStatus = statusByDate.get(toCalendarDate(windowStart))

    if (windowStartExplicitStatus === 'complete' && completedCount >= schedule.frequency)
      for (let i = windowStartIndex; i <= windowEndIndex; i += 1) {
        const entry = computedEntries[i]
        if (entry) entry.status = 'not-required'
      }

    if (windowStartExplicitStatus === 'complete') completedCount -= 1
    windowStart = add(windowStart, { days: 1 })
    windowStartIndex += 1

    const nextWindowEnd = getWindowEnd(windowStart, schedule)
    eachDayOfInterval({ start: windowEnd, end: nextWindowEnd })
      .slice(1)
      .forEach((date) => {
        if (statusByDate.get(toCalendarDate(date)) === 'complete') completedCount += 1
        windowEndIndex += 1
      })
    windowEnd = nextWindowEnd
  }

  // Assign explicit statuses over computedEntries
  computedEntries.forEach((entry) => {
    const explicitStatus = statusByDate.get(toCalendarDate(entry.day))
    if (explicitStatus) entry.status = explicitStatus
  })

  return computedEntries.slice(-dayCount)
}
