import { clsx } from 'clsx'
import { Day } from '~/shared/lib'

import styles from './Timeline.module.css'
import type { DayRange } from './types'

export interface TimelineProps extends DayRange {}

export const Timeline = ({ start, end }: TimelineProps) => {
  const days = Day.eachDayOfInterval(start, end)

  return (
    <div className={styles.timeline} aria-hidden>
      <div className={styles.grid}>
        {days.map((day, i) => (
          <div key={day.value} className={clsx(styles.cell, 'hint')}>
            {i % 3 === 0 && (
              <>
                <div>{day.format('d')}</div>
                <div>{day.format('EEE')}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
