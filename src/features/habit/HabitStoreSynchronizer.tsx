import { useEffect } from 'react'

import { hydrateHabitStore } from './actions'

export const HabitStoreSynchronizer = () => {
  useEffect(() => {
    hydrateHabitStore().catch((error: unknown) => {
      console.error(error)
      // TODO show a toast when hydration fails.
    })
  }, [])

  return null
}
