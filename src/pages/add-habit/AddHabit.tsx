import { Form } from '@base-ui/react/form'
import { ChevronLeft, Save } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'

import { addHabit } from '~/features/habit'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Schedule } from '~/shared/components/Schedule'
import { TextField } from '~/shared/components/TextField'
import { DEFAULT_SCHEDULE, Path } from '~/shared/constants'
import { usePageTitle } from '~/shared/hooks'

import styles from './AddHabit.module.css'

interface AddHabitFormValues {
  name: string
  description: string
}

export const AddHabit = () => {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [isSubmitting, setIsSubmitting] = useState(false)

  usePageTitle(t('AddHabit.title'))

  const validateName = (value: unknown) =>
    typeof value === 'string' && value.trim() !== '' ? null : t('AddHabit.errors.nameRequired')

  const handleSubmit = async (values: AddHabitFormValues) => {
    setIsSubmitting(true)
    try {
      await addHabit({
        name: values.name.trim(),
        description: values.description.trim(),
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
            aria-label={t('AddHabit.back')}
          />
        }
      />
      <main className={styles.main}>
        <Form className={styles.form} onFormSubmit={handleSubmit}>
          <TextField
            label={t('AddHabit.fields.name')}
            name='name'
            placeholder={t('AddHabit.fields.namePlaceholder')}
            validate={validateName}
          />
          <TextField
            component='textarea'
            label={t('AddHabit.fields.description')}
            name='description'
            placeholder={t('AddHabit.fields.descriptionPlaceholder')}
          />
          <Schedule value={schedule} onValueChange={setSchedule} />
          <Button icon={<Save />} type='submit' className={styles.save} disabled={isSubmitting}>
            {t('AddHabit.save')}
          </Button>
        </Form>
      </main>
    </>
  )
}
