import { Field } from '@base-ui/react/field'
import { OTPField as BaseOTPField } from '@base-ui/react/otp-field'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'

import styles from './OTPField.module.css'

const OTP_LENGTH = 6

type OTPControlProps = Omit<
  BaseOTPField.Root.Props,
  | 'autoSubmit'
  | 'children'
  | 'className'
  | 'disabled'
  | 'length'
  | 'name'
  | 'render'
  | 'style'
  | 'validationType'
>

export interface OTPFieldProps
  extends Pick<
      Field.Root.Props,
      | 'actionsRef'
      | 'className'
      | 'disabled'
      | 'name'
      | 'validate'
      | 'validationDebounceTime'
      | 'validationMode'
    >,
    OTPControlProps {
  label: string
  hideLabel?: boolean
}

export const OTPField = ({
  label,
  hideLabel,
  actionsRef,
  name,
  validate,
  validationMode,
  validationDebounceTime,
  disabled,
  className,
  ...otpFieldProps
}: OTPFieldProps) => {
  const { t } = useTranslation()
  const fieldRootProps = {
    actionsRef,
    name,
    validate,
    validationMode,
    validationDebounceTime,
    disabled,
  }

  return (
    <Field.Root {...fieldRootProps} className={clsx(styles.root, 'label', className)}>
      <Field.Label className={clsx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </Field.Label>
      <div className={styles.group}>
        <BaseOTPField.Root
          {...otpFieldProps}
          className={styles.control}
          disabled={disabled}
          inputMode='numeric'
          length={OTP_LENGTH}
          validationType='numeric'
        >
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <BaseOTPField.Input
              key={index}
              aria-label={
                index === 0
                  ? undefined
                  : t('OTPField.characterLabel', { position: index + 1, length: OTP_LENGTH })
              }
              className={clsx(styles.input, 'subheading')}
            />
          ))}
        </BaseOTPField.Root>
        <Field.Error className={clsx(styles.error, 'hint')} />
      </div>
    </Field.Root>
  )
}
