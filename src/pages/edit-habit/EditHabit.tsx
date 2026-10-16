import { clsx } from 'clsx'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useRoute } from 'wouter'

import { deleteHabit, editHabit, useHabitStore } from '~/entities/habit'
import { HabitForm, type HabitFormValues } from '~/features/habit-editor'
import { isErrorNamed, usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Dialog } from '~/shared/ui/Dialog'
import { Layout } from '~/shared/ui/Layout'
import { showSnackbar } from '~/shared/ui/Snackbar'

import styles from './EditHabit.module.css'

const deletionDialog = Dialog.createHandle()

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

  return (
    <Layout
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
    >
      {hydrationStatus === 'ready' && !habit && (
        <div className={styles.empty}>
          <h2 className='subheading'>{t('EditHabit.empty.text')}</h2>
          <Button as='Link' to={Path.Home}>
            {t('EditHabit.empty.button')}
          </Button>
        </div>
      )}

      {hydrationStatus === 'ready' && habit && (
        <>
          <HabitForm
            initialValues={habit}
            onSubmit={handleSubmit}
            disabled={isSubmitting || isDeleting}
            additionalAction={
              <Dialog.Trigger handle={deletionDialog}>
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
              </Dialog.Trigger>
            }
          />
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title={t('EditHabit.deleteDialog.title')}
            handle={deletionDialog}
          >
            <Dialog.Title className='title'>{t('EditHabit.deleteDialog.title')}</Dialog.Title>
            <Dialog.Description className={clsx(styles.dialogDescription, 'body')}>
              {t('EditHabit.deleteDialog.description', { habit: habit.name })}
            </Dialog.Description>
            <div className={styles.dialogActions}>
              <Dialog.Close>
                <Button type='button' variant='ghost'>
                  {t('EditHabit.deleteDialog.cancel')}
                </Button>
              </Dialog.Close>
              <Button type='button' color='danger' onClick={handleDelete} disabled={isDeleting}>
                {t('shared.delete')}
              </Button>
            </div>
          </Dialog>
        </>
      )}
    </Layout>
  )
}
