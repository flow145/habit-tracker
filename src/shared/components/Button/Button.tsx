import { Button as BaseButton } from '@base-ui/react/button'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './Button.module.css'

export type ButtonVariant = 'filled' | 'muted' | 'ghost'
export type ButtonColor = 'neutral' | 'danger'

export interface ButtonProps extends BaseButton.Props {
  variant?: ButtonVariant
  color?: ButtonColor
  icon?: ReactNode
}

export const Button = ({
  variant = 'filled',
  color = 'neutral',
  icon,
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <BaseButton
      className={clsx(styles.button, 'button', styles[variant], styles[color], className)}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </BaseButton>
  )
}
