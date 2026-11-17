import { clsx } from 'clsx'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { authClient } from '~/shared/auth'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Dialog } from '~/shared/ui/Dialog'
import { Layout } from '~/shared/ui/Layout'
import { showSnackbar } from '~/shared/ui/Snackbar'

import styles from './Sync.module.css'

const signOutDialog = Dialog.createHandle()
const deleteAccountDialog = Dialog.createHandle()

export interface SyncStatusProps {
  email: string
}

export const SyncStatus = ({ email }: SyncStatusProps) => {
  const { t } = useTranslation()
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSignOutPending, setIsSignOutPending] = useState(false)

  const handleSignOutDialogOpenChange = (open: boolean) => {
    if (!isSignOutPending) setIsSignOutDialogOpen(open)
  }

  const handleSignOut = async () => {
    setIsSignOutPending(true)

    try {
      const { error } = await authClient.signOut()

      if (error) {
        showSnackbar(t('notifications.requestFailed'))
        return
      }

      setIsSignOutDialogOpen(false)
    } catch {
      showSnackbar(t('notifications.requestFailed'))
    } finally {
      setIsSignOutPending(false)
    }
  }

  const backButton = (
    <Button
      variant='ghost'
      icon={<ChevronLeft />}
      as='Link'
      to={Path.Home}
      aria-label={t('shared.back')}
    />
  )

  return (
    <Layout title={t('Sync.title')} startSlot={backButton}>
      <div className={styles.content}>
        <h2 className={clsx('subheading', styles.description)}>
          {t('Sync.signedInAs', { email })}
        </h2>
        <div className={styles.actions}>
          <Dialog.Trigger handle={signOutDialog}>
            <Button type='button' variant='muted'>
              {t('Sync.signOut')}
            </Button>
          </Dialog.Trigger>
          <Dialog.Trigger handle={deleteAccountDialog}>
            <Button type='button' variant='ghost' color='danger' icon={<Trash2 />}>
              {t('Sync.deleteAccount')}
            </Button>
          </Dialog.Trigger>
        </div>
      </div>

      <Dialog
        open={isSignOutDialogOpen}
        onOpenChange={handleSignOutDialogOpenChange}
        title={t('Sync.signOutDialog.title')}
        handle={signOutDialog}
      >
        <Dialog.Title className='title'>{t('Sync.signOutDialog.title')}</Dialog.Title>
        <Dialog.Description className={clsx(styles.dialogDescription, 'body')}>
          {t('Sync.signOutDialog.description')}
        </Dialog.Description>
        <div className={styles.dialogActions}>
          <Dialog.Close>
            <Button type='button' variant='ghost' disabled={isSignOutPending}>
              {t('Sync.cancel')}
            </Button>
          </Dialog.Close>
          <Button type='button' loading={isSignOutPending} onClick={handleSignOut}>
            {t('Sync.signOut')}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t('Sync.deleteAccountDialog.title')}
        handle={deleteAccountDialog}
      >
        <Dialog.Title className='title'>{t('Sync.deleteAccountDialog.title')}</Dialog.Title>
        <Dialog.Description className={clsx(styles.dialogDescription, 'body')}>
          {t('Sync.deleteAccountDialog.description')}
        </Dialog.Description>
        <div className={styles.dialogActions}>
          <Dialog.Close>
            <Button type='button' variant='ghost'>
              {t('Sync.cancel')}
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button type='button' color='danger'>
              {t('shared.delete')}
            </Button>
          </Dialog.Close>
        </div>
      </Dialog>
    </Layout>
  )
}
