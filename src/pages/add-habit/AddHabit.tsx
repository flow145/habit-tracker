import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { addHabit, useHabitStore } from '~/features/habit'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Path } from '~/shared/constants'
import { usePageTitle } from '~/shared/hooks'

import { HabitForm, type HabitFormValues } from '../habit-form'
import styles from './AddHabit.module.css'

export const AddHabit = () => {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)

  usePageTitle(t('AddHabit.title'))

  const handleSubmit = ({ name, description, schedule }: HabitFormValues) => {
    const addHabitOperation = addHabit({
      name,
      description,
      schedule,
    })

    navigate(Path.Home, { replace: true })
    addHabitOperation.catch((error: unknown) => {
      console.error(error)
      // TODO show a toast when adding a habit fails.
    })
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
        {hydrationStatus === 'ready' && <HabitForm onSubmit={handleSubmit} />}
      </main>
    </>
  )
}
