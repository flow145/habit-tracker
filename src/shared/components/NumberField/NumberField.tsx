import { Field } from '@base-ui/react/field'
import { NumberField as BaseNumberField } from '@base-ui/react/number-field'
import { clsx } from 'clsx'
import { createPortal } from 'react-dom'

import styles from './NumberField.module.css'

export interface NumberFieldProps
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
    Pick<
      BaseNumberField.Root.Props,
      | 'allowOutOfRange'
      | 'defaultValue'
      | 'form'
      | 'max'
      | 'min'
      | 'onValueChange'
      | 'onValueCommitted'
      | 'readOnly'
      | 'required'
      | 'step'
      | 'value'
    > {
  label: string
  hideLabel?: boolean
  errorContainer?: HTMLElement | null
}

export const NumberField = ({
  label,
  hideLabel,
  errorContainer,
  className,
  name,
  validate,
  validationMode,
  validationDebounceTime,
  actionsRef,
  disabled,
  ...numberFieldProps
}: NumberFieldProps) => {
  const fieldRootProps = {
    name,
    validate,
    validationMode,
    validationDebounceTime,
    actionsRef,
    disabled,
  }
  const error = <Field.Error className={clsx(styles.error, 'hint')} />

  return (
    <Field.Root {...fieldRootProps} className={clsx(styles.root, 'label', className)}>
      <BaseNumberField.Root {...numberFieldProps} className={styles.field}>
        <Field.Label className={clsx(styles.label, hideLabel && 'visually-hidden')}>
          {label}
        </Field.Label>
        <BaseNumberField.Input className={clsx(styles.control, 'body')} />
      </BaseNumberField.Root>
      {errorContainer ? createPortal(error, errorContainer) : error}
    </Field.Root>
  )
}
