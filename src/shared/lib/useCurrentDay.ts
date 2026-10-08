import { useEffect, useState } from 'react'

import { Day } from './Day'

const CHECK_INTERVAL = 60_000

export const useCurrentDay = (): Day => {
  const [day, setDay] = useState(() => new Day())

  useEffect(() => {
    const updateIfDayChanged = () => {
      const next = new Day()
      setDay((current) => (current.value === next.value ? current : next))
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

  return day
}
