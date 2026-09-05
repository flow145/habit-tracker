import { Form } from '@base-ui/react/form'
import { ChevronLeft, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Schedule } from '~/shared/components/Schedule'
import { TextField } from '~/shared/components/TextField'
import { Path } from '~/shared/constants'
import { usePageTitle } from '~/shared/hooks'

import styles from './AddHabit.module.css'

export const AddHabit = () => {
  const { t } = useTranslation()

  usePageTitle(t('AddHabit.title'))

  const handleSubmit = (values: Record<string, unknown>) => {
    console.log('handleSubmit', values)
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
          />
          <TextField
            component='textarea'
            label={t('AddHabit.fields.description')}
            name='description'
            placeholder={t('AddHabit.fields.descriptionPlaceholder')}
          />
          <Schedule />
          <Button icon={<Save />} type='submit' className={styles.save}>
            {t('AddHabit.save')}
          </Button>
        </Form>
      </main>
    </>
  )
}
