import { Button } from '@base-ui/react/button'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './IconButton.module.css'

export type IconButtonVariant = 'filled' | 'muted' | 'ghost'

export interface IconButtonProps extends Omit<Button.Props, 'children'> {
  variant?: IconButtonVariant
  icon: ReactNode
}

export const IconButton = ({ variant = 'filled', icon, className, ...props }: IconButtonProps) => {
  return (
    <Button className={clsx(styles.button, styles[variant], className)} {...props}>
      {icon}
    </Button>
  )
}
