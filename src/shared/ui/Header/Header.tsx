import type { ReactNode } from 'react'

import styles from './Header.module.css'

export interface HeaderProps {
  title: string
  startSlot?: ReactNode
  endSlot?: ReactNode
}

export const Header = ({ title, startSlot, endSlot }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.slot}>{startSlot}</div>
        <h1 className='title'>{title}</h1>
        <div className={styles.slot}>{endSlot}</div>
      </div>
    </header>
  )
}
