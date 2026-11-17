import { Field } from '@base-ui/react/field'
import { OTPField as BaseOTPField } from '@base-ui/react/otp-field'
import { clsx } from 'clsx'
import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'

import styles from './OTPField.module.css'

type OTPControlProps = Omit<
  BaseOTPField.Root.Props,
  | 'children'
  | 'className'
  | 'disabled'
  | 'inputMode'
  | 'name'
  | 'normalizeValue'
  | 'render'
  | 'style'
  | 'validationType'
>

// `validationType='numeric'` also puts a `\d{length}` pattern on Base UI's hidden validation
// input, which surfaces the browser's "Please match the requested format." for partial codes.
// Filter digits here instead and leave completeness errors to the `validate` prop.
const digitsOnly = (value: string) => value.replace(/\D/g, '')

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
  length: number
  firstInputRef?: Ref<HTMLInputElement>
}

export const OTPField = ({
  label,
  hideLabel,
  length,
  firstInputRef,
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
          length={length}
          normalizeValue={digitsOnly}
          validationType='none'
        >
          {Array.from({ length }, (_, index) => (
            <BaseOTPField.Input
              key={index}
              ref={index === 0 ? firstInputRef : undefined}
              aria-label={
                index === 0
                  ? undefined
                  : t('OTPField.characterLabel', { position: index + 1, length })
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
