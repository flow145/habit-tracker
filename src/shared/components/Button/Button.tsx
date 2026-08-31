import { Button as BaseButton } from '@base-ui/react/button'
import { clsx } from 'clsx'
import type { ReactElement } from 'react'

import styles from './Button.module.css'

export type ButtonVariant = 'filled' | 'muted' | 'ghost'
export type ButtonColor = 'neutral' | 'danger'

export interface ButtonProps extends BaseButton.Props {
  variant?: ButtonVariant
  color?: ButtonColor
  icon?: ReactElement
}

export const Button = ({
  variant = 'filled',
  color = 'neutral',
  icon,
  className,
  children,
  ...props
}: ButtonProps) => {
  const type = (() => {
    if (icon && !children) return 'icon'
    if (!icon && children) return 'text'
    return 'icon-text'
  })()

  return (
    <BaseButton
      className={clsx(styles.button, 'button', styles[variant], styles[color], className)}
      data-type={type}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.text}>{children}</span>}
    </BaseButton>
  )
}
