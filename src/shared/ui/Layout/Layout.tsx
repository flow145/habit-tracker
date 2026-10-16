import type { ReactNode } from 'react'

import { Header } from '../Header'

import styles from './Layout.module.css'

export interface LayoutProps {
  title: string
  startSlot?: ReactNode
  endSlot?: ReactNode
  children?: ReactNode
}

export const Layout = ({ title, startSlot, endSlot, children }: LayoutProps) => {
  return (
    <div className={styles.page}>
      <Header title={title} startSlot={startSlot} endSlot={endSlot} />
      <main className={styles.main}>
        <div className={styles.container}>{children}</div>
      </main>
    </div>
  )
}
