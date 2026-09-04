import { Field } from '@base-ui/react/field'
import { Select as BaseSelect } from '@base-ui/react/select'
import { clsx } from 'clsx'
import { Check, ChevronDown } from 'lucide-react'

import styles from './Select.module.css'

export type SelectLayout = 'block' | 'inline'

export interface SelectItem {
  value: string
  label: string
}

export interface SelectProps
  extends Pick<
      Field.Root.Props,
      'className' | 'disabled' | 'name' | 'validate' | 'validationDebounceTime' | 'validationMode'
    >,
    Omit<BaseSelect.Root.Props<SelectItem, false>, 'multiple' | 'children' | 'name'> {
  label: string
  items: SelectItem[]
  placeholder?: string
  layout?: SelectLayout
  hideLabel?: boolean
}

export const Select = ({
  label,
  placeholder,
  layout = 'block',
  hideLabel,
  name,
  validate,
  validationMode,
  validationDebounceTime,
  disabled,
  className,
  ...props
}: SelectProps) => {
  const fieldRootProps = { name, validate, validationMode, validationDebounceTime, disabled }

  return (
    <Field.Root {...fieldRootProps} className={clsx(styles.select, className)} data-layout={layout}>
      <BaseSelect.Root {...props}>
        <BaseSelect.Label
          className={clsx(styles.label, 'label', hideLabel && 'visually-hidden')}
          data-disabled={disabled}
        >
          {label}
        </BaseSelect.Label>
        <div className={styles.group}>
          <BaseSelect.Trigger className={clsx(styles.trigger, 'body')}>
            <BaseSelect.Value
              className={styles.value}
              placeholder={placeholder}
              data-disabled={disabled}
            />
            <BaseSelect.Icon className={styles.icon}>
              <ChevronDown />
            </BaseSelect.Icon>
          </BaseSelect.Trigger>
          <Field.Error className={clsx(styles.error, 'hint')} />
        </div>
        <BaseSelect.Portal>
          <BaseSelect.Positioner
            className={styles.positioner}
            align='start'
            alignItemWithTrigger={false}
            side='bottom'
            sideOffset={2}
            collisionPadding={0}
          >
            <BaseSelect.Popup className={styles.popup}>
              <BaseSelect.List className={styles.list}>
                {props.items.map((item) => (
                  <BaseSelect.Item
                    key={item.value}
                    value={item}
                    className={clsx(styles.item, 'body')}
                  >
                    <BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator className={styles.indicator}>
                      <Check size={24} />
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </Field.Root>
  )
}
