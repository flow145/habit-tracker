import { Field } from '@base-ui/react/field'
import { NumberField as BaseNumberField } from '@base-ui/react/number-field'
import { clsx } from 'clsx'

import styles from './NumberField.module.css'

export interface NumberFieldProps
  extends Pick<
      Field.Root.Props,
      'className' | 'disabled' | 'name' | 'validate' | 'validationDebounceTime' | 'validationMode'
    >,
    Pick<
      BaseNumberField.Root.Props,
      | 'allowOutOfRange'
      | 'defaultValue'
      | 'form'
      | 'max'
      | 'min'
      | 'onValueChange'
      | 'readOnly'
      | 'required'
      | 'step'
      | 'value'
    > {
  label: string
  hideLabel?: boolean
}

export const NumberField = ({
  label,
  hideLabel,
  className,
  name,
  validate,
  validationMode,
  validationDebounceTime,
  disabled,
  ...numberFieldProps
}: NumberFieldProps) => {
  const fieldRootProps = { name, validate, validationMode, validationDebounceTime, disabled }

  return (
    <Field.Root {...fieldRootProps} className={clsx(styles.root, 'label', className)}>
      <BaseNumberField.Root {...numberFieldProps} className={styles.field}>
        <Field.Label className={clsx(styles.label, hideLabel && 'visually-hidden')}>
          {label}
        </Field.Label>
        <BaseNumberField.Input className={clsx(styles.control, 'body')} />
      </BaseNumberField.Root>
      <Field.Error className={clsx(styles.error, 'hint')} />
    </Field.Root>
  )
}
