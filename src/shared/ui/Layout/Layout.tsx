import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Header } from '../Header'

import styles from './Layout.module.css'

export interface LayoutProps {
  title: string
  startSlot?: ReactNode
  endSlot?: ReactNode
  compact?: boolean
  children?: ReactNode
}

export const Layout = ({ title, compact, startSlot, endSlot, children }: LayoutProps) => {
  return (
    <div className={styles.page}>
      <Header title={title} startSlot={startSlot} endSlot={endSlot} />
      <main className={clsx(styles.main, compact && styles.compact)}>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  )
}
