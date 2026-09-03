import { clsx } from 'clsx'
import type { ComponentProps, ReactElement } from 'react'
import { Link } from 'wouter'

import styles from './Button.module.css'

export type ButtonVariant = 'filled' | 'muted' | 'ghost'
export type ButtonColor = 'neutral' | 'danger'

interface ButtonSharedProps {
  variant?: ButtonVariant
  color?: ButtonColor
  icon?: ReactElement
}

type ButtonAsButtonProps = Omit<ComponentProps<'button'>, 'color'> & {
  as?: 'button'
}

type ButtonAsAnchorProps = Omit<ComponentProps<'a'>, 'color'> & {
  as: 'a'
}

type ButtonAsLinkProps = Omit<ComponentProps<'a'>, 'color' | 'href'> & {
  as: 'Link'
  to: string
  replace?: boolean
  transition?: boolean
  className?: string | ((active: boolean) => string)
}

export type ButtonProps = ButtonSharedProps &
  (ButtonAsButtonProps | ButtonAsAnchorProps | ButtonAsLinkProps)

export const Button = ({
  variant = 'filled',
  color = 'neutral',
  icon,
  className,
  children,
  ...props
}: ButtonProps) => {
  const appearance = (() => {
    if (icon && !children) return 'icon'
    if (!icon && children) return 'text'
    return 'icon-text'
  })()

  const classes = clsx(styles.button, 'button', styles[variant], styles[color], className)
  const content = (
    <>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children && <span className={styles.text}>{children}</span>}
    </>
  )

  if (props.as === 'Link') {
    const { as, ...rest } = props
    return (
      <Link className={classes} data-appearance={appearance} {...rest}>
        {content}
      </Link>
    )
  }

  if (props.as === 'a') {
    const { as, ...rest } = props
    return (
      <a className={classes} data-appearance={appearance} {...rest}>
        {content}
      </a>
    )
  }

  const { as, ...rest } = props
  return (
    <button type='button' className={classes} data-appearance={appearance} {...rest}>
      {content}
    </button>
  )
}
