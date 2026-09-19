import { Form } from '@base-ui/react/form'
import { Save } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/shared/components/Button'
import { Schedule } from '~/shared/components/Schedule'
import { TextField } from '~/shared/components/TextField'
import { DEFAULT_SCHEDULE } from '~/shared/constants'
import type { Schedule as ScheduleValue } from '~/shared/db'

import styles from './HabitForm.module.css'

const INITIAL_VALUES = { name: '', description: '', schedule: DEFAULT_SCHEDULE }

export interface HabitFormValues {
  name: string
  description: string
  schedule: ScheduleValue
}

export interface HabitFormProps {
  initialValues?: HabitFormValues
  onSubmit: (values: HabitFormValues) => void | Promise<void>
  additionalAction?: ReactNode
  disabled?: boolean
}

export const HabitForm = ({
  initialValues = INITIAL_VALUES,
  onSubmit,
  additionalAction,
  disabled = false,
}: HabitFormProps) => {
  const { t } = useTranslation()
  const [schedule, setSchedule] = useState(initialValues.schedule)

  const validateName = (value: unknown) =>
    typeof value === 'string' && value.trim() !== '' ? null : t('HabitForm.errors.nameRequired')

  const handleSubmit = async (values: Omit<HabitFormValues, 'schedule'>) => {
    await onSubmit({ ...values, schedule })
  }

  return (
    <Form className={styles.form} onFormSubmit={handleSubmit}>
      <TextField
        label={t('AddHabit.fields.name')}
        name='name'
        defaultValue={initialValues.name}
        placeholder={t('AddHabit.fields.namePlaceholder')}
        validate={validateName}
        disabled={disabled}
      />
      <TextField
        component='textarea'
        label={t('AddHabit.fields.description')}
        name='description'
        defaultValue={initialValues.description}
        placeholder={t('AddHabit.fields.descriptionPlaceholder')}
        disabled={disabled}
      />
      <Schedule value={schedule} onValueChange={setSchedule} disabled={disabled} />
      <div className={styles.actions}>
        <Button icon={<Save />} type='submit' disabled={disabled}>
          {t('shared.save')}
        </Button>
        {additionalAction}
      </div>
    </Form>
  )
}
