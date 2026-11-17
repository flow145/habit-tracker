import { Form } from '@base-ui/react/form'
import { clsx } from 'clsx'
import { ChevronLeft } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { authClient, authErrors, OTP_LENGTH } from '~/shared/auth'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Layout } from '~/shared/ui/Layout'
import { OTPField } from '~/shared/ui/OTPField'
import { showSnackbar } from '~/shared/ui/Snackbar'
import { TextField } from '~/shared/ui/TextField'

import styles from './Sync.module.css'

type SignInStep = 'email' | 'otp'
type SignInErrors = Partial<Record<'email' | 'otp', string>>

const emailSchema = z.email()

export const SignInForm = () => {
  const { t } = useTranslation()
  const [step, setStep] = useState<SignInStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [errors, setErrors] = useState<SignInErrors>({})
  const [isSignInPending, setIsSignInPending] = useState(false)
  const [isRequestOtpPending, setIsRequestOtpPending] = useState(false)
  const emailFieldRef = useRef<HTMLInputElement>(null)
  const otpInputRef = useRef<HTMLInputElement>(null)

  const trimmedEmail = email.trim()

  useEffect(() => {
    if (step === 'email') emailFieldRef.current?.focus()
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

  const validateEmail = (value: unknown) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) return t('Sync.errors.emailRequired')
    return emailSchema.safeParse(text).success ? null : t('Sync.errors.emailInvalid')
  }

  const validateOtp = (value: unknown) => {
    const text = typeof value === 'string' ? value : ''
    return text.length < OTP_LENGTH ? t('Sync.errors.otpIncomplete', { length: OTP_LENGTH }) : null
  }

  const requestOtp = async () => {
    if (isRequestOtpPending || isSignInPending) return
    setIsRequestOtpPending(true)

    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: trimmedEmail,
        type: 'sign-in',
      })

      if (error) {
        if (error.code === authErrors.INVALID_EMAIL)
          setErrors({ email: t('Sync.errors.emailInvalid') })
        else showSnackbar(t('notifications.requestFailed'))
        return
      }

      setErrors({})
      setStep('otp')
      otpInputRef.current?.focus()
    } catch {
      showSnackbar(t('notifications.requestFailed'))
    } finally {
      setIsRequestOtpPending(false)
    }
  }

  const signIn = async () => {
    if (isSignInPending) return

    setIsSignInPending(true)

    try {
      const { error } = await authClient.signIn.emailOtp({ email: trimmedEmail, otp })

      if (!error) return

      if (error.code === authErrors.INVALID_OTP) {
        setErrors({ otp: t('Sync.errors.otpInvalid') })
      } else if (error.code === authErrors.OTP_EXPIRED) {
        setErrors({ otp: t('Sync.errors.otpExpired') })
      } else if (error.code === authErrors.TOO_MANY_ATTEMPTS) {
        showSnackbar(t('Sync.errors.otpTooManyAttempts'))
      } else {
        showSnackbar(t('notifications.requestFailed'))
      }
    } catch {
      showSnackbar(t('notifications.requestFailed'))
    } finally {
      setIsSignInPending(false)
    }
  }

  const handleSubmit = () => {
    if (step === 'email') {
      requestOtp()
      return
    }

    signIn()
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    setErrors({})
  }

  const backButton =
    step === 'email' ? (
      <Button
        variant='ghost'
        icon={<ChevronLeft />}
        as='Link'
        to={Path.Home}
        aria-label={t('shared.back')}
      />
    ) : (
      <Button
        type='button'
        variant='ghost'
        icon={<ChevronLeft />}
        onClick={handleBack}
        disabled={isSignInPending}
        aria-label={t('shared.back')}
      />
    )

  return (
    <Layout title={t('Sync.title')} startSlot={backButton}>
      <Form key={step} className={styles.content} errors={errors} onFormSubmit={handleSubmit}>
        <h2 className={clsx('subheading', styles.description)}>{t('Sync.description')}</h2>
        <TextField
          name='email'
          label={t('Sync.email')}
          type='email'
          autoComplete='email'
          placeholder={t('Sync.emailPlaceholder')}
          value={email}
          onValueChange={setEmail}
          validate={validateEmail}
          disabled={isRequestOtpPending || step === 'otp'}
          ref={emailFieldRef}
        />
        {step === 'otp' && (
          <div className={styles.reveal}>
            <OTPField
              className={styles.otp}
              name='otp'
              label={t('Sync.otpLabel')}
              autoComplete='one-time-code'
              autoSubmit
              value={otp}
              onValueChange={setOtp}
              validate={validateOtp}
              length={OTP_LENGTH}
              disabled={isSignInPending}
              firstInputRef={otpInputRef}
            />
          </div>
        )}
        <div className={styles.actions}>
          {step === 'email' && (
            <Button type='submit' loading={isRequestOtpPending}>
              {t('Sync.sendCode')}
            </Button>
          )}
          {step === 'otp' && (
            <>
              <Button type='submit' loading={isSignInPending}>
                {t('Sync.signIn')}
              </Button>
              <Button
                type='button'
                variant='ghost'
                loading={isRequestOtpPending}
                disabled={isRequestOtpPending || isSignInPending}
                onClick={requestOtp}
              >
                {t('Sync.resendCode')}
              </Button>
            </>
          )}
        </div>
      </Form>
    </Layout>
  )
}
