import { clsx } from 'clsx'
import { format } from 'date-fns'
import { Check, Squircle } from 'lucide-react'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type { ComputedStatus, HabitWithEntries } from '~/features/habit'
import SquircleCheckIcon from '~/shared/assets/icons/squircle-check.svg'

import styles from './HabitItem.module.css'

const STATUS_CONFIG: Record<ComputedStatus, { icon: ReactElement; key: string }> = {
  complete: { icon: <Check />, key: 'complete' },
  incomplete: { icon: <Squircle />, key: 'incomplete' },
  'not-required': { icon: <SquircleCheckIcon />, key: 'notRequired' },
}

const getNextStatus = (status: ComputedStatus): 'complete' | 'incomplete' =>
  status === 'complete' ? 'incomplete' : 'complete'

export interface HabitItemProps {
  habit: HabitWithEntries
  onToggleDay: (day: Date, nextStatus: 'complete' | 'incomplete') => void
}

export const HabitItem = ({ habit, onToggleDay }: HabitItemProps) => {
  const { t } = useTranslation()

  return (
    <article className={styles.habit}>
      <h2 className={clsx(styles.name, 'subheading')}>{habit.name}</h2>
      <ol className={styles.dayList}>
        {habit.entries.map((entry) => {
          const nextStatus = getNextStatus(entry.status)

          return (
            <li key={entry.day.toISOString()} className={styles.dayItem}>
              <button
                type='button'
                className={styles.dayToggle}
                aria-label={t('HabitItem.dayToggle', {
                  date: format(entry.day, 'MMMM d'),
                  currentStatus: t(`HabitItem.dayStatus.${STATUS_CONFIG[entry.status].key}`),
                  nextStatus: t(`HabitItem.dayStatus.${nextStatus}`),
                })}
                onClick={() => onToggleDay(entry.day, nextStatus)}
              >
                {STATUS_CONFIG[entry.status].icon}
              </button>
            </li>
          )
        })}
      </ol>
    </article>
  )
}
