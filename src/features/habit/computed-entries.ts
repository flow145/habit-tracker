import { add, eachDayOfInterval, format, isBefore, isSameDay, min, sub } from 'date-fns'

import type { Entry, Schedule, Status } from '~/shared/db'

export type ComputedStatus = Status | 'incomplete' | 'not-required'
type CalendarDate = `${number}-${number}-${number}`

export interface ComputedEntry {
  day: Date
  status: ComputedStatus
}

export const getWindowEnd = (date: Date, { interval, intervalUnit }: Schedule) => {
  const firstDayAfterWindow = add(date, { [intervalUnit]: interval })
  return sub(firstDayAfterWindow, { days: 1 })
}

export const isSameDayOrBefore = (date: Date, dateToCompare: Date) =>
  isSameDay(date, dateToCompare) || isBefore(date, dateToCompare)

const toCalendarDate = (date: Date) => format(date, 'yyyy-MM-dd') as CalendarDate

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
  if (!isSameDayOrBefore(start, end)) return []

  const statusByDate = new Map(entries.map((entry) => [toCalendarDate(entry.day), entry.status]))

  const computedEntries: ComputedEntry[] = []

  let entryCount = 0
  let windowStart = start
  let windowEnd = getWindowEnd(windowStart, schedule)

  // Accumulating phase: build the first complete sliding window
  for (
    let date = windowStart;
    isSameDayOrBefore(date, min([windowEnd, end]));
    date = add(date, { days: 1 })
  ) {
    if (statusByDate.get(toCalendarDate(date)) === 'complete') entryCount += 1
  }

  // Sliding window phase: advance the window start one day at a time,
  // recalculate the window end and entry count, and derive computed statuses
  while (isSameDayOrBefore(windowEnd, end)) {
    const explicitStatus = statusByDate.get(toCalendarDate(windowStart))
    const computedStatus = entryCount >= schedule.frequency ? 'not-required' : 'incomplete'

    computedEntries.push({ day: windowStart, status: explicitStatus ?? computedStatus })

    if (explicitStatus === 'complete') entryCount -= 1
    windowStart = add(windowStart, { days: 1 })

    const nextWindowEnd = getWindowEnd(windowStart, schedule)
    eachDayOfInterval({ start: windowEnd, end: nextWindowEnd })
      .slice(1)
      .forEach((date) => {
        if (statusByDate.get(toCalendarDate(date)) === 'complete') entryCount += 1
      })
    windowEnd = nextWindowEnd
  }

  // Trailing phase: the final window cannot slide further,
  // so mark all remaining incomplete days as not required when the schedule is satisfied
  if (!isSameDayOrBefore(windowEnd, end)) {
    const computedStatus = entryCount >= schedule.frequency ? 'not-required' : 'incomplete'

    eachDayOfInterval({ start: windowStart, end }).forEach((date) => {
      const explicitStatus = statusByDate.get(toCalendarDate(date))
      computedEntries.push({ day: date, status: explicitStatus ?? computedStatus })
    })
  }

  return computedEntries
}
