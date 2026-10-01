import { Field } from '@base-ui/react/field'
import { Fieldset } from '@base-ui/react/fieldset'
import { Radio } from '@base-ui/react/radio'
import { RadioGroup } from '@base-ui/react/radio-group'
import { clsx } from 'clsx'
import { Squircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { HabitColor } from '~/shared/api'

import styles from './ColorField.module.css'

export interface ColorFieldProps {
  value: HabitColor
  onValueChange: (value: HabitColor) => void
  disabled?: boolean
}

export const COLORS = [
  'red',
  'ruby',
  'crimson',
  'pink',
  'plum',
  'purple',
  'violet',
  'iris',
  'indigo',
  'blue',
  'sky',
  'cyan',
  'teal',
  'mint',
  'jade',
  'green',
  'grass',
  'lime',
  'yellow',
  'amber',
  'orange',
  'tomato',
  'brown',
  'bronze',
  'gold',
  'slate',
] as const

export const ColorField = ({ value, onValueChange, disabled }: ColorFieldProps) => {
  const { t } = useTranslation()

  return (
    <Field.Root name='color'>
      <Fieldset.Root
        render={
          <RadioGroup<HabitColor>
            className={styles.radiogroup}
            value={value}
            onValueChange={onValueChange}
          />
        }
        disabled={disabled}
      >
        <Fieldset.Legend className={clsx(styles.legend, 'label')}>
          {t('ColorField.legend')}
        </Fieldset.Legend>
        <span className={styles.grid}>
          {COLORS.map((color) => (
            <Field.Item key={color}>
              <Radio.Root
                aria-label={t(`ColorField.colors.${color}`)}
                className={styles.radio}
                value={color}
                style={{
                  '--fill': `var(--${color}-8)`,
                  '--stroke': `var(--${color}-12)`,
                }}
              >
                <Squircle size={40} />
              </Radio.Root>
            </Field.Item>
          ))}
        </span>
      </Fieldset.Root>
    </Field.Root>
  )
}
