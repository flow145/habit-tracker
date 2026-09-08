import { clsx } from 'clsx'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useRoute } from 'wouter'

import { deleteHabit, editHabit, getHabit } from '~/features/habit'
import { AlertDialog } from '~/shared/components/AlertDialog'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Path } from '~/shared/constants'
import type { Habit } from '~/shared/db'
import { usePageTitle } from '~/shared/hooks'

import { HabitForm, type HabitFormValues } from '../habit-form'
import styles from './EditHabit.module.css'

const deletionDialog = AlertDialog.createHandle()

export const EditHabit = () => {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const [, params] = useRoute(`${Path.EditHabit}/:id`)
  const [habit, setHabit] = useState<Habit>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const habitId = params?.id
  const isBusy = isSubmitting || isDeleting

  usePageTitle(t('EditHabit.title'))

  useEffect(() => {
    if (!habitId) {
      navigate(Path.Home, { replace: true })
      return
    }

    let isCurrent = true

    getHabit(habitId).then((result) => {
      if (!isCurrent) return
      if (!result) {
        navigate(Path.Home, { replace: true })
        return
      }
      setHabit(result)
    })

    return () => {
      isCurrent = false
    }
  }, [habitId, navigate])

  const handleSubmit = async ({ name, description, schedule }: HabitFormValues) => {
    if (!habitId) return

    setIsSubmitting(true)

    try {
      await editHabit({
        id: habitId,
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

  const handleDelete = async () => {
    if (!habitId) return

    setIsDeleting(true)

    try {
      await deleteHabit(habitId)
      navigate(Path.Home, { replace: true })
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Header
        title={t('EditHabit.title')}
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
        {habit && (
          <>
            <HabitForm
              initialValues={habit}
              onSubmit={handleSubmit}
              additionalAction={
                <AlertDialog.Trigger handle={deletionDialog}>
                  <Button
                    type='button'
                    variant='ghost'
                    color='danger'
                    icon={<Trash2 />}
                    disabled={isBusy}
                    aria-label={t('EditHabit.deleteLabel')}
                  >
                    {t('shared.delete')}
                  </Button>
                </AlertDialog.Trigger>
              }
              disabled={isBusy}
            />
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              title={t('EditHabit.deleteDialog.title')}
              handle={deletionDialog}
            >
              <AlertDialog.Title className='title'>
                {t('EditHabit.deleteDialog.title')}
              </AlertDialog.Title>
              <AlertDialog.Description className={clsx(styles.dialogDescription, 'body')}>
                {t('EditHabit.deleteDialog.description', { habit: habit.name })}
              </AlertDialog.Description>
              <div className={styles.dialogActions}>
                <AlertDialog.Close>
                  <Button type='button' variant='ghost' disabled={isDeleting}>
                    {t('EditHabit.deleteDialog.cancel')}
                  </Button>
                </AlertDialog.Close>
                <Button type='button' color='danger' onClick={handleDelete} disabled={isDeleting}>
                  {t('shared.delete')}
                </Button>
              </div>
            </AlertDialog>
          </>
        )}
      </main>
    </>
  )
}
