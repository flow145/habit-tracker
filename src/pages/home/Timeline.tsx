import { clsx } from 'clsx'
import { eachDayOfInterval, format } from 'date-fns'

import type { DateRange } from '~/features/habit'

import styles from './Timeline.module.css'

export interface TimelineProps extends DateRange {}

export const Timeline = ({ start, end }: TimelineProps) => {
  const days = eachDayOfInterval({ start, end })

  return (
    <div className={styles.timeline} aria-hidden>
      <div className={styles.grid}>
        {days.map((day, i) => (
          <div key={day.toISOString()} className={clsx(styles.cell, 'hint')}>
            {i % 3 === 0 && (
              <>
                <div>{format(day, 'd')}</div>
                <div>{format(day, 'EEE')}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
