import { clsx } from 'clsx'
import { format, subDays } from 'date-fns'

import styles from './Timeline.module.css'

export const DAY_COUNT = 10

export const getTimelineStart = () => subDays(new Date(), DAY_COUNT - 1)

export const Timeline = () => {
  const today = new Date()
  const days = Array.from({ length: DAY_COUNT }, (_, i) => subDays(today, DAY_COUNT - 1 - i))

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
