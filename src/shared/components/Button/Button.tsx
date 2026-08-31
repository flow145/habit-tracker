import { Button as BaseButton } from '@base-ui/react/button'
import { clsx } from 'clsx'
import type { ReactElement, ReactNode } from 'react'

import styles from './Button.module.css'

export type ButtonVariant = 'filled' | 'muted' | 'ghost'
export type ButtonColor = 'neutral' | 'danger'

interface CommonButtonProps extends Omit<BaseButton.Props, 'children'> {
  variant?: ButtonVariant
  color?: ButtonColor
}

interface TextButtonProps extends CommonButtonProps {
  icon?: ReactElement
  children: ReactNode
}

interface IconButtonProps extends CommonButtonProps {
  icon: ReactElement
  'aria-label': string
  children?: undefined
}

export type ButtonProps = TextButtonProps | IconButtonProps

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
