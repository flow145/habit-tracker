import { Form } from '@base-ui/react/form'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { deleteUser, requestDeletionOtp, verifyDeletionOtp } from '~/entities/auth'
import { authErrors, OTP_LENGTH } from '~/shared/auth'
import { Button } from '~/shared/ui/Button'
import { Dialog } from '~/shared/ui/Dialog'
import { OTPField } from '~/shared/ui/OTPField'
import { showSnackbar } from '~/shared/ui/Snackbar'

import styles from './DeleteAccountDialog.module.css'

type DeleteStep = 'confirm' | 'otp'
type DeleteErrors = Partial<Record<'otp', string>>

export interface DeleteAccountDialogProps {
  email: string
  handle: ReturnType<typeof Dialog.createHandle>
}

export const DeleteAccountDialog = ({ email, handle }: DeleteAccountDialogProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<DeleteStep>('confirm')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState<DeleteErrors>({})
  const [isDeletePending, setIsDeletePending] = useState(false)
  const [isResendPending, setIsResendPending] = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  const isPending = isDeletePending || isResendPending

  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

  const handleOpenChange = (open: boolean) => {
    if (!isPending) setIsOpen(open)
  }

  const handleOpenChangeComplete = (open: boolean) => {
    if (open) return
    setStep('confirm')
    setOtp('')
    setErrors({})
  }

  const validateOtp = (value: unknown) => {
    const text = typeof value === 'string' ? value : ''
    return text.length < OTP_LENGTH ? t('Sync.errors.otpIncomplete', { length: OTP_LENGTH }) : null
  }

  const requestOtp = async () => {
    try {
      const { error } = await requestDeletionOtp(email)
      if (!error) return true
    } catch {}

    showSnackbar(t('notifications.requestFailed'))
    return false
  }

  const verifyOtp = async () => {
    const { error } = await verifyDeletionOtp(email, otp)
    if (!error) return true

    if (error.code === authErrors.INVALID_OTP) {
      setErrors({ otp: t('Sync.errors.otpInvalid') })
    } else if (error.code === authErrors.OTP_EXPIRED) {
      setErrors({ otp: t('Sync.errors.otpExpired') })
    } else if (error.code === authErrors.TOO_MANY_ATTEMPTS) {
      showSnackbar(t('Sync.errors.otpTooManyAttempts'))
    } else {
      showSnackbar(t('notifications.requestFailed'))
    }

    return false
  }

  const handleDelete = async () => {
    if (isPending) return
    setIsDeletePending(true)

    try {
      if (step === 'otp' && !(await verifyOtp())) {
        setIsDeletePending(false)
        return
      }

      const { error } = await deleteUser()

      if (!error) {
        showSnackbar(t('notifications.accountDeleted'))
        return
      }

      if (step === 'confirm' && error.code === authErrors.SESSION_EXPIRED) {
        const isSent = await requestOtp()
        setIsDeletePending(false)
        if (isSent) {
          setErrors({})
          setStep('otp')
        }
        return
      }

      setIsDeletePending(false)
      showSnackbar(t('notifications.requestFailed'))
    } catch {
      setIsDeletePending(false)
      showSnackbar(t('notifications.requestFailed'))
    }
  }

  const handleResend = async () => {
    if (isPending) return
    setIsResendPending(true)

    if (await requestOtp()) {
      setErrors({})
      otpInputRef.current?.focus()
    }

    setIsResendPending(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={handleOpenChangeComplete}
      title={t('Sync.deleteAccountDialog.title')}
      handle={handle}
    >
      <Form key={step} className={styles.form} errors={errors} onFormSubmit={handleDelete}>
        <div className={styles.text}>
          <Dialog.Title className='title'>{t('Sync.deleteAccountDialog.title')}</Dialog.Title>
          <Dialog.Description className='body'>
            {t('Sync.deleteAccountDialog.description')}
          </Dialog.Description>
        </div>
        {step === 'otp' && (
          <div className={styles.reveal}>
            <OTPField
              className={styles.otp}
              name='otp'
              label={t('Sync.otpLabel')}
              autoComplete='one-time-code'
              value={otp}
              onValueChange={setOtp}
              validate={validateOtp}
              length={OTP_LENGTH}
              disabled={isDeletePending}
              firstInputRef={otpInputRef}
            />
          </div>
        )}
        <div className={styles.actions}>
          {step === 'otp' && (
            <Button
              type='button'
              variant='ghost'
              loading={isResendPending}
              disabled={isPending}
              onClick={handleResend}
            >
              {t('Sync.deleteAccountDialog.resend')}
            </Button>
          )}
          <div className={styles.actionGroup}>
            <Dialog.Close>
              <Button type='button' variant='ghost' disabled={isPending}>
                {t('Sync.cancel')}
              </Button>
            </Dialog.Close>
            <Button
              type='submit'
              color='danger'
              loading={isDeletePending}
              disabled={isResendPending}
            >
              {t('shared.delete')}
            </Button>
          </div>
        </div>
      </Form>
    </Dialog>
  )
}
