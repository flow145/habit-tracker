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
  extends Omit<BaseSelect.Root.Props<SelectItem, false>, 'multiple' | 'children'> {
  label: string
  items: SelectItem[]
  placeholder?: string
  layout?: SelectLayout
  hideLabel?: boolean
  className?: string
}

export const Select = ({
  label,
  placeholder,
  layout = 'block',
  hideLabel,
  className,
  ...props
}: SelectProps) => {
  return (
    <BaseSelect.Root {...props}>
      <div className={clsx(styles.select, className)} data-layout={layout}>
        <BaseSelect.Label
          className={clsx(styles.label, 'label', hideLabel && 'visually-hidden')}
          data-disabled={props.disabled}
        >
          {label}
        </BaseSelect.Label>
        <div className={styles.group}>
          <BaseSelect.Trigger className={clsx(styles.trigger, 'body')}>
            <BaseSelect.Value
              className={styles.value}
              placeholder={placeholder}
              data-disabled={props.disabled}
            />
            <BaseSelect.Icon className={styles.icon}>
              <ChevronDown />
            </BaseSelect.Icon>
          </BaseSelect.Trigger>
        </div>
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
  )
}
