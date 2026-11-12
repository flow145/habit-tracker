import { clsx } from 'clsx'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { type SubmitEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Dialog } from '~/shared/ui/Dialog'
import { Layout } from '~/shared/ui/Layout'
import { OTPField } from '~/shared/ui/OTPField'
import { TextField } from '~/shared/ui/TextField'

import styles from './Sync.module.css'

type SyncView = 'sign-in' | 'confirm-sign-in' | 'status'

const DEMO_EMAIL = 'demo@email.com'

const signOutDialog = Dialog.createHandle()
const deleteAccountDialog = Dialog.createHandle()

export const Sync = () => {
  const { t } = useTranslation()
  const [view, setView] = useState<SyncView>('sign-in')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isSignInView = view === 'sign-in'
  const isConfirmView = view === 'confirm-sign-in'

  usePageTitle(t('Sync.title'))

  const handleFormSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSignInView) setView('confirm-sign-in')
    else if (isConfirmView) setView('status')
  }

  const backButton =
    view === 'confirm-sign-in' ? (
      <Button
        type='button'
        variant='ghost'
        icon={<ChevronLeft />}
        onClick={() => setView('sign-in')}
        aria-label={t('shared.back')}
      />
    ) : (
      <Button
        variant='ghost'
        icon={<ChevronLeft />}
        as='Link'
        to={Path.Home}
        aria-label={t('shared.back')}
      />
    )

  return (
    <>
      <Layout title={t('Sync.title')} startSlot={backButton}>
        {view !== 'status' ? (
          <form className={styles.content} onSubmit={handleFormSubmit} noValidate>
            <h2 className={clsx('subheading', styles.description)}>{t('Sync.description')}</h2>
            <TextField
              label={t('Sync.email')}
              type='email'
              autoComplete='email'
              placeholder={t('Sync.emailPlaceholder')}
              value={email}
              onValueChange={setEmail}
              disabled={isConfirmView}
            />
            {isConfirmView && (
              <OTPField
                label={t('Sync.otpLabel')}
                autoComplete='one-time-code'
                value={otp}
                onValueChange={setOtp}
              />
            )}
            <div className={styles.actions}>
              {isSignInView && <Button type='submit'>{t('Sync.sendCode')}</Button>}
              {isConfirmView && (
                <>
                  <Button type='submit'>{t('Sync.signIn')}</Button>
                  <Button type='button' variant='ghost' disabled>
                    {t('Sync.resendCode', { seconds: 60 })}
                  </Button>
                </>
              )}
            </div>
          </form>
        ) : (
          <div className={styles.content}>
            <h2 className={clsx('subheading', styles.description)}>
              {t('Sync.signedInAs', { email: email.trim() || DEMO_EMAIL })}
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
        )}
      </Layout>

      <Dialog
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        title={t('Sync.signOutDialog.title')}
        handle={signOutDialog}
      >
        <Dialog.Title className='title'>{t('Sync.signOutDialog.title')}</Dialog.Title>
        <Dialog.Description className={clsx(styles.dialogDescription, 'body')}>
          {t('Sync.signOutDialog.description')}
        </Dialog.Description>
        <div className={styles.dialogActions}>
          <Dialog.Close>
            <Button type='button' variant='ghost'>
              {t('Sync.cancel')}
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <Button type='button'>{t('Sync.signOut')}</Button>
          </Dialog.Close>
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
    </>
  )
}
