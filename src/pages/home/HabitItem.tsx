import { clsx } from 'clsx'
import { format } from 'date-fns'
import { Check, Squircle } from 'lucide-react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type { ComputedStatus, HabitWithComputedEntries } from '~/features/habit'
import { getNextStatus } from '~/features/habit'
import SquircleCheckIcon from '~/shared/assets/icons/squircle-check.svg'
import styles from './HabitItem.module.css'

const STATUS_CONFIG: Record<ComputedStatus, { icon: ReactElement; key: string }> = {
  complete: { icon: <Check />, key: 'complete' },
  incomplete: { icon: <Squircle />, key: 'incomplete' },
  'not-required': { icon: <SquircleCheckIcon />, key: 'notRequired' },
}

export interface HabitItemProps {
  habit: HabitWithComputedEntries
  onToggleDay: (day: Date, currentStatus: ComputedStatus) => void
}

export const HabitItem = ({ habit, onToggleDay }: HabitItemProps) => {
  const { t } = useTranslation()

  return (
    <article className={styles.habit}>
      <h2 className={clsx(styles.name, 'subheading')}>{habit.name}</h2>
      <ol className={styles.dayList}>
        {habit.computedEntries.map(({ day, status }) => {
          const nextStatus = getNextStatus(status)
          const isMuted = status === 'incomplete' || status === 'not-required'

          return (
            <li key={day.toISOString()} className={styles.dayItem}>
              <button
                type='button'
                className={clsx(styles.dayToggle, isMuted && styles.muted)}
                aria-label={t('HabitItem.dayToggle', {
                  date: format(day, 'MMMM d'),
                  currentStatus: t(`HabitItem.dayStatus.${STATUS_CONFIG[status].key}`),
                  nextStatus: t(`HabitItem.dayStatus.${nextStatus}`),
                })}
                onClick={() => onToggleDay(day, status)}
              >
                {STATUS_CONFIG[status].icon}
              </button>
            </li>
          )
        })}
      </ol>
    </article>
  )
}
