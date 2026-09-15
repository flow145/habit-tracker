import { useEffect } from 'react'

import { useTranslation } from 'react-i18next'
import { hydrateHabitStore } from './actions'

export const HabitStoreSynchronizer = () => {
  const { t } = useTranslation()

  useEffect(() => {
    hydrateHabitStore().catch((error: unknown) => {
      console.error(error)
      alert(t('shared.initFailed'))
    })
  }, [])

  return null
}
