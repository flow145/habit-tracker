import { clsx } from 'clsx'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useRoute } from 'wouter'

import { deleteHabit, editHabit, useHabitStore } from '~/entities/habit'
import { HabitForm, type HabitFormValues } from '~/features/habit-editor'
import { isErrorNamed, usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { AlertDialog } from '~/shared/ui/AlertDialog'
import { Button } from '~/shared/ui/Button'
import { Header } from '~/shared/ui/Header'
import { showSnackbar } from '~/shared/ui/Snackbar'

import styles from './EditHabit.module.css'

const deletionDialog = AlertDialog.createHandle()

export const EditHabit = () => {
  const { t } = useTranslation()
  const [, navigate] = useLocation()
  const [, params] = useRoute(`${Path.EditHabit}/:id`)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)
  const habitId = params?.id
  const habit = useHabitStore((state) => state.habitsById[habitId ?? ''])

  usePageTitle(t('EditHabit.title'))

  const handleSubmit = async ({ name, notes, color, schedule }: HabitFormValues) => {
    if (!habitId) return

    setIsSubmitting(true)

    try {
      await editHabit({ id: habitId, name, notes, color, schedule })
      showSnackbar(t('notifications.habitUpdated'))
      navigate(`/${habitId}`, { replace: true })
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

  const handleDelete = async () => {
    if (!habitId) return

    setIsDeleting(true)

    try {
      await deleteHabit(habitId)
      showSnackbar(t('notifications.habitDeleted'))
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
      setIsDeleting(false)
    }
  }

  const header = (
    <Header
      title={t('EditHabit.title')}
      startSlot={
        <Button
          variant='ghost'
          icon={<ChevronLeft />}
          as='Link'
          to={habitId ? `/${habitId}` : Path.Home}
          aria-label={t('shared.back')}
        />
      }
    />
  )

  return (
    <>
      {header}

      {hydrationStatus === 'ready' && !habit && (
        <main className={styles.empty}>
          <h2 className='subheading'>{t('EditHabit.empty.text')}</h2>
          <Button as='Link' to={Path.Home}>
            {t('EditHabit.empty.button')}
          </Button>
        </main>
      )}

      {hydrationStatus === 'ready' && habit && (
        <main className={styles.main}>
          <HabitForm
            initialValues={habit}
            onSubmit={handleSubmit}
            disabled={isSubmitting || isDeleting}
            additionalAction={
              <AlertDialog.Trigger handle={deletionDialog}>
                <Button
                  type='button'
                  variant='ghost'
                  color='danger'
                  icon={<Trash2 />}
                  aria-label={t('EditHabit.deleteLabel')}
                  disabled={isSubmitting || isDeleting}
                >
                  {t('shared.delete')}
                </Button>
              </AlertDialog.Trigger>
            }
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
                <Button type='button' variant='ghost'>
                  {t('EditHabit.deleteDialog.cancel')}
                </Button>
              </AlertDialog.Close>
              <Button type='button' color='danger' onClick={handleDelete} disabled={isDeleting}>
                {t('shared.delete')}
              </Button>
            </div>
          </AlertDialog>
        </main>
      )}
    </>
  )
}
