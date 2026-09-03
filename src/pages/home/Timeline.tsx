import { clsx } from 'clsx'
import { format, subDays } from 'date-fns'

import { MAX_DAYS } from './dates'
import styles from './Timeline.module.css'

export const Timeline = () => {
  const today = new Date()
  const dates = Array.from({ length: MAX_DAYS }, (_, i) => subDays(today, MAX_DAYS - 1 - i))

  return (
    <div className={styles.timeline} aria-hidden>
      <div className={styles.grid}>
        {dates.map((day, i) => (
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
