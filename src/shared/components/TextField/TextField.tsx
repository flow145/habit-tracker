import { Field } from '@base-ui/react/field'
import { clsx } from 'clsx'

import styles from './TextField.module.css'

export type TextFieldComponent = 'input' | 'textarea'

export interface TextFieldProps
  extends Pick<
      Field.Root.Props,
      'className' | 'disabled' | 'name' | 'validate' | 'validationDebounceTime' | 'validationMode'
    >,
    Omit<Field.Control.Props, 'className' | 'name' | 'style' | 'render'> {
  component?: TextFieldComponent
  label: string
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
  hideLabel,
  name,
  validate,
  validationMode,
  validationDebounceTime,
  disabled,
  className,
  ...controlProps
}: TextFieldProps) => {
  const fieldRootProps = { name, validate, validationMode, validationDebounceTime, disabled }

  return (
    <Field.Root {...fieldRootProps} className={clsx(styles.root, 'label', className)}>
      <Field.Label className={clsx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </Field.Label>
      <div className={styles.group}>
        <Field.Control
          render={component === 'textarea' ? <textarea rows={3} /> : undefined}
          className={clsx(styles.control, 'body')}
          {...controlProps}
        />
        <Field.Error className={clsx(styles.error, 'hint')} />
      </div>
    </Field.Root>
  )
}
