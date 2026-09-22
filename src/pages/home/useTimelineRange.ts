import { useEffect, useMemo, useState } from 'react'

import { Day } from '~/shared/lib'

import type { DayRange } from './types'

const DAY_COUNT = 10
const CHECK_INTERVAL = 60_000

const getTimelineStart = (end: Day) => end.subtract({ days: DAY_COUNT - 1 })

const getRange = (end: Day): DayRange => ({
  start: getTimelineStart(end),
  end,
})

export const useTimelineRange = (): DayRange => {
  const [end, setEnd] = useState(() => new Day())

  useEffect(() => {
    const updateIfDayChanged = () => {
      const next = new Day()
      setEnd((current) => (current.value === next.value ? current : next))
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
