import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { addHabit } from '~/features/habit'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Path } from '~/shared/constants'
import { usePageTitle } from '~/shared/hooks'

import { HabitForm, type HabitFormValues } from '../habit-form'
import styles from './AddHabit.module.css'

export const AddHabit = () => {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  usePageTitle(t('AddHabit.title'))

  const handleSubmit = async ({ name, description, schedule }: HabitFormValues) => {
    setIsSubmitting(true)

    try {
      await addHabit({
        name: name.trim(),
        description: description.trim(),
        schedule,
      })
      navigate(Path.Home, { replace: true })
    } catch (error) {
      console.error(error)
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
        <HabitForm onSubmit={handleSubmit} disabled={isSubmitting} />
      </main>
    </>
  )
}
