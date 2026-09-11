import { isSameDay, subDays } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'

import type { DateRange } from '~/features/habit'

const DAY_COUNT = 10
const CHECK_INTERVAL = 60_000

const getTimelineStart = (end = new Date()) => subDays(end, DAY_COUNT - 1)

const getRange = (end: Date): DateRange => ({
  start: getTimelineStart(end),
  end,
})

export const useTimelineRange = (): DateRange => {
  const [end, setEnd] = useState(new Date())

  useEffect(() => {
    const updateIfDayChanged = () => {
      const next = new Date()
      setEnd((current) => (isSameDay(current, next) ? current : next))
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') updateIfDayChanged()
    }

    const intervalId = window.setInterval(updateIfDayChanged, CHECK_INTERVAL)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return useMemo(() => getRange(end), [end])
}
