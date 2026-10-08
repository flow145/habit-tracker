import { clsx } from 'clsx'
import { isMonday } from 'date-fns'
import { useState } from 'react'

import { Day } from '~/shared/lib'

import styles from './Timeline.module.css'
import type { DayRange } from './types'

const SHOW_INTERVAL = 3

export interface TimelineProps {
  range: DayRange
}

export const Timeline = ({ range }: TimelineProps) => {
  const days = Day.eachDayOfInterval(range.start, range.end)
  const [visibleDate, setVisibleDate] = useState<string | null>(null)

  const toggleHiddenDate = (date: string) => {
    setVisibleDate((visibleDate) => (visibleDate === date ? null : date))
  }

  return (
    <div className={styles.timeline} aria-hidden>
      <div className={styles.grid}>
        {days.map((day, i) => (
          // biome-ignore lint/a11y/noStaticElementInteractions: Timeline is intentionally decorative
          // biome-ignore lint/a11y/useKeyWithClickEvents: Timeline is intentionally decorative
          <div
            key={day.value}
            className={clsx(
              styles.cell,
              'hint',
              isMonday(day.toDate()) && styles.weekStart,
              i % SHOW_INTERVAL !== 0 && visibleDate !== day.value && styles.hidden,
            )}
            onClick={() => toggleHiddenDate(day.value)}
          >
            <div>{day.format('d')}</div>
            <div>{day.format('EEE')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
