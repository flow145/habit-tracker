import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { addHabit, useHabitStore } from '~/entities/habit'
import { HabitForm, type HabitFormValues } from '~/features/habit-editor'
import type { HabitColor } from '~/shared/api'
import { isErrorNamed, usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Header } from '~/shared/ui/Header'
import { showSnackbar } from '~/shared/ui/Snackbar'
import styles from './AddHabit.module.css'

const DEFAULT_HABIT_COLOR: HabitColor = 'indigo'

export const AddHabit = () => {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)

  usePageTitle(t('AddHabit.title'))

  const handleSubmit = async ({ name, notes, schedule }: HabitFormValues) => {
    setIsSubmitting(true)

    try {
      await addHabit({ name, notes, color: DEFAULT_HABIT_COLOR, schedule })
      showSnackbar(t('notifications.habitAdded'))
      navigate(Path.Home, { replace: true })
    } catch (error) {
      console.error(error)
      showSnackbar(
        t(
          isErrorNamed(error, 'QuotaExceededError')
            ? 'notifications.storageFull'
            : 'notifications.changeFailed',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header
        title={t('AddHabit.title')}
        startSlot={
          <Button
            variant='ghost'
            icon={<ChevronLeft />}
            as='Link'
            to={Path.Home}
            aria-label={t('shared.back')}
          />
        }
      />
      <main className={styles.main}>
        {hydrationStatus === 'ready' && (
          <HabitForm onSubmit={handleSubmit} disabled={isSubmitting} />
        )}
      </main>
    </>
  )
}
