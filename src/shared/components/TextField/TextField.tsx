import { Field, type FieldControlProps, type FieldRootProps } from '@base-ui/react/field'
import { clsx } from 'clsx'

import styles from './TextField.module.css'

export interface TextFieldProps
  extends Pick<FieldRootProps, 'dirty' | 'touched' | 'disabled' | 'invalid' | 'className'>,
    Omit<FieldControlProps, 'className' | 'style' | 'render'> {
  label: string
  error?: string
  hideLabel?: boolean
}

export const TextField = ({
  label,
  error,
  hideLabel,
  dirty,
  touched,
  disabled,
  invalid,
  className,
  ...controlProps
}: TextFieldProps) => {
  const rootProps = { dirty, touched, disabled, invalid: invalid || !!error }

  return (
    <Field.Root className={clsx(styles.root, 'label', className)} {...rootProps}>
      <Field.Label className={clsx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </Field.Label>
      <div className={styles.group}>
        <Field.Control className={clsx(styles.control, 'body')} {...controlProps} />
        {error && (
          <Field.Error className={clsx(styles.error, 'hint')} match>
            {error}
          </Field.Error>
        )}
      </div>
    </Field.Root>
  )
}
