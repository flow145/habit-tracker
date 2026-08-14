import { add, eachDayOfInterval, format, isBefore, isSameDay, min, sub } from 'date-fns'

import type { Completion, CompletionStatus, Schedule } from '~/shared/db'

type DayStatus = CompletionStatus | 'incomplete' | 'not-required'
type CalendarDate = `${number}-${number}-${number}`

export interface HabitDay {
  day: Date
  status: DayStatus
}

const getWindowEnd = (date: Date, { interval, intervalUnit }: Schedule) => {
  const firstDayAfterWindow = add(date, { [intervalUnit]: interval })
  return sub(firstDayAfterWindow, { days: 1 })
}

const isSameDayOrBefore = (date: Date, dateToCompare: Date) =>
  isSameDay(date, dateToCompare) || isBefore(date, dateToCompare)

const toCalendarDate = (date: Date) => format(date, 'yyyy-MM-dd') as CalendarDate

export const buildHabitDays = ({
  start,
  end,
  completions,
  schedule,
}: {
  start: Date
  end: Date
  completions: Completion[]
  schedule: Schedule
}): HabitDay[] => {
  const statusByDate = new Map(
    completions.map((completion) => [toCalendarDate(completion.day), completion.status]),
  )

  const habitDays: HabitDay[] = []

  let completionCount = 0
  let windowStart = start
  let windowEnd = getWindowEnd(windowStart, schedule)

  // Accumulating phase: build the first complete sliding window
  for (
    let date = windowStart;
    isSameDayOrBefore(date, min([windowEnd, end]));
    date = add(date, { days: 1 })
  ) {
    if (statusByDate.get(toCalendarDate(date)) === 'complete') completionCount += 1
  }

  // Sliding window phase: advance the window start one day at a time,
  // recalculate the window end and completion count, and derive day statuses
  while (isSameDayOrBefore(windowEnd, end)) {
    const explicitStatus = statusByDate.get(toCalendarDate(windowStart))
    const derivedStatus = completionCount >= schedule.frequency ? 'not-required' : 'incomplete'

    habitDays.push({ day: windowStart, status: explicitStatus ?? derivedStatus })

    if (explicitStatus === 'complete') completionCount -= 1
    windowStart = add(windowStart, { days: 1 })

    const nextWindowEnd = getWindowEnd(windowStart, schedule)
    eachDayOfInterval({ start: windowEnd, end: nextWindowEnd })
      .slice(1)
      .forEach((date) => {
        if (statusByDate.get(toCalendarDate(date)) === 'complete') completionCount += 1
      })
    windowEnd = nextWindowEnd
  }

  // Trailing phase: the final window cannot slide further,
  // so mark all remaining incomplete days as not required when the schedule is satisfied
  if (!isSameDayOrBefore(windowEnd, end)) {
    const derivedStatus = completionCount >= schedule.frequency ? 'not-required' : 'incomplete'

    eachDayOfInterval({ start: windowStart, end }).forEach((date) => {
      const explicitStatus = statusByDate.get(toCalendarDate(date))
      habitDays.push({ day: date, status: explicitStatus ?? derivedStatus })
    })
  }

  return habitDays
}
