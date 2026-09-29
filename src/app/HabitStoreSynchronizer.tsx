import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { hydrateHabitStore } from '~/entities/habit'
import { showSnackbar } from '~/shared/ui/Snackbar'

export const HabitStoreSynchronizer = () => {
  const { t } = useTranslation()

  useEffect(() => {
    hydrateHabitStore().catch((error: unknown) => {
      console.error(error)
      showSnackbar(t('notifications.initFailed'))
    })
  }, [])

  return null
}
