import { Button as BaseButton, type ButtonProps as BaseButtonProps } from '@base-ui/react/button'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './IconButton.module.css'

export type IconButtonVariant = 'filled' | 'muted' | 'ghost'

export interface IconButtonProps extends Omit<BaseButtonProps, 'children'> {
  variant?: IconButtonVariant
  icon: ReactNode
}

export const IconButton = ({ variant = 'filled', icon, className, ...props }: IconButtonProps) => {
  return (
    <BaseButton className={clsx(styles.button, styles[variant], className)} {...props}>
      {icon}
    </BaseButton>
  )
}
