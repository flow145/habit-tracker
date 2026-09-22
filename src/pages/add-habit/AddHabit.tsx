import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { addHabit, useHabitStore } from '~/entities/habit'
import { HabitForm, type HabitFormValues } from '~/features/habit-editor'
import { isErrorNamed, usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Header } from '~/shared/ui/Header'

import styles from './AddHabit.module.css'

export const AddHabit = () => {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)

  usePageTitle(t('AddHabit.title'))

  const handleSubmit = async ({ name, description, schedule }: HabitFormValues) => {
    setIsSubmitting(true)

    try {
      await addHabit({ name, description, schedule })
      navigate(Path.Home, { replace: true })
    } catch (error) {
      console.error(error)
      alert(
        t(isErrorNamed(error, 'QuotaExceededError') ? 'shared.storageFull' : 'shared.changeFailed'),
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
