import { Field, type FieldControlProps, type FieldRootProps } from '@base-ui/react/field'
import { clsx } from 'clsx'

import styles from './TextField.module.css'

export type TextFieldComponent = 'input' | 'textarea'

export interface TextFieldProps
  extends Pick<FieldRootProps, 'dirty' | 'touched' | 'disabled' | 'invalid' | 'className'>,
    Omit<FieldControlProps, 'className' | 'style' | 'render'> {
  component?: TextFieldComponent
  label: string
  error?: string
  hideLabel?: boolean
}

/**
 * - this doesn't work well with textarea types
 * - no auto-resizing
 * - no way to hide the default handle and keep resizing (to add a custom handle)
 * TODO use Textarea component https://github.com/mui/base-ui/issues/718
 */

export const TextField = ({
  component = 'input',
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
        <Field.Control
          render={component === 'textarea' ? <textarea rows={3} /> : undefined}
          className={clsx(styles.control, 'body')}
          {...controlProps}
        />
        {error && (
          <Field.Error className={clsx(styles.error, 'hint')} match>
            {error}
          </Field.Error>
        )}
      </div>
    </Field.Root>
  )
}
