import { clsx } from 'clsx'
import { format } from 'date-fns'
import { Check, Squircle } from 'lucide-react'
import { type ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import {
  buildComputedEntries,
  type ComputedStatus,
  getNextStatus,
  toggleDay,
  useHabitStore,
} from '~/entities/habit'
import SquircleCheckIcon from '~/shared/assets/icons/squircle-check.svg'
import { Path } from '~/shared/routes'

import styles from './HabitItem.module.css'
import type { DateRange } from './types'

const STATUS_CONFIG: Record<ComputedStatus, { icon: ReactElement; i18nKey: string }> = {
  complete: { icon: <Check />, i18nKey: 'complete' },
  incomplete: { icon: <Squircle />, i18nKey: 'incomplete' },
  'not-required': { icon: <SquircleCheckIcon />, i18nKey: 'notRequired' },
}

export interface HabitItemProps {
  habitId: string
  range: DateRange
}

export const HabitItem = ({ habitId, range }: HabitItemProps) => {
  const { t } = useTranslation()
  const habit = useHabitStore((state) => state.habitsById[habitId ?? ''])
  const entries = useHabitStore((state) => state.entriesByHabitId[habitId] ?? {})

  const computedEntries = useMemo(
    () =>
      habit
        ? buildComputedEntries({
            start: range.start,
            end: range.end,
            entries,
            schedule: habit.schedule,
          })
        : [],
    [habit, entries, range.start, range.end],
  )

  if (!habit) return null

  const handleToggleDay = (day: Date) => {
    toggleDay({ habitId, day }).catch((error: unknown) => {
      console.error(error)
      alert(t('shared.changeFailed'))
    })
  }

  return (
    <article className={styles.habit}>
      <h2 className={clsx(styles.name, 'subheading')}>
        <Link className={styles.nameLink} to={`${Path.EditHabit}/${habit.id}`}>
          {habit.name}
        </Link>
      </h2>
      <ol className={styles.dayList}>
        {computedEntries.map(({ day, status }) => {
          const nextStatus = getNextStatus(status)
          const isMuted = status === 'incomplete' || status === 'not-required'
          const { icon, i18nKey } = STATUS_CONFIG[status]

          return (
            <li key={day.toISOString()} className={styles.dayItem}>
              <button
                type='button'
                className={clsx(styles.dayToggle, isMuted && styles.muted)}
                aria-label={t('HabitItem.dayToggle', {
                  date: format(day, 'MMMM d'),
                  currentStatus: t(`HabitItem.dayStatus.${i18nKey}`),
                  nextStatus: t(`HabitItem.dayStatus.${nextStatus}`),
                })}
                onClick={() => handleToggleDay(day)}
              >
                {icon}
              </button>
            </li>
          )
        })}
      </ol>
    </article>
  )
}
