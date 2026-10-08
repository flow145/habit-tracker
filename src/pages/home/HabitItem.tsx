import { Meter } from '@base-ui/react/meter'
import { clsx } from 'clsx'
import { Check, ChevronRight, Squircle } from 'lucide-react'
import { type ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import {
  type ComputedEntry,
  type ComputedStatus,
  getNextStatus,
  toggleDay,
  useHabitData,
  useHabitStore,
} from '~/entities/habit'
import { Day, isErrorNamed } from '~/shared/lib'
import { showSnackbar } from '~/shared/ui/Snackbar'

import styles from './HabitItem.module.css'
import SquircleCheckIcon from './squircle-check.svg'
import type { DayRange } from './types'

const STATUS_CONFIG: Record<ComputedStatus, { icon: ReactElement; i18nKey: string }> = {
  complete: { icon: <Check />, i18nKey: 'complete' },
  incomplete: { icon: <Squircle />, i18nKey: 'incomplete' },
  'not-required': { icon: <SquircleCheckIcon />, i18nKey: 'notRequired' },
}

export interface HabitItemProps {
  habitId: string
  range: DayRange
}

export const HabitItem = ({ habitId, range }: HabitItemProps) => {
  const { t } = useTranslation()
  const habit = useHabitStore((state) => state.habitsById[habitId ?? ''])
  const { computedEntries, strengths } = useHabitData(habitId)
  const strength = Math.round((strengths.at(-1) ?? 0) * 100)
  const start = range.start.value
  const end = range.end.value

  const computedEntriesInRange = useMemo(() => {
    // Full history contains consecutive days in chronological order.
    const firstDay = computedEntries[0]?.day

    return Day.eachDayOfInterval(new Day(start), new Day(end)).map<ComputedEntry>((day) => {
      const entry = firstDay && computedEntries[day.differenceInDays(firstDay)]
      return entry ?? { day, status: 'incomplete' }
    })
  }, [computedEntries, start, end])

  if (!habit) return null

  const { color } = habit
  const colors = {
    '--bg-color': `var(--${color}-2)`,
    '--toggle-color': `var(--${color}-11)`,
    '--toggle-hover-color': `var(--${color}-12)`,
    '--muted-color': `var(--${color}-8)`,
    '--strength-color': `var(--${color}-8)`,
  }

  const handleToggleDay = (day: Day) => {
    toggleDay({ habitId, day }).catch((error: unknown) => {
      console.error(error)
      showSnackbar(
        t(
          isErrorNamed(error, 'QuotaExceededError')
            ? 'notifications.storageFull'
            : 'notifications.changeFailed',
        ),
      )
    })
  }

  return (
    <article className={styles.habit} style={colors}>
      <Link className={styles.link} to={`/${habit.id}`}>
        <h2 className={clsx(styles.name, 'subheading')}>{habit.name}</h2>
        <ChevronRight className={styles.chevron} />
      </Link>
      <ol className={styles.dayList}>
        {computedEntriesInRange.map(({ day, status }) => {
          const nextStatus = getNextStatus(status)
          const isMuted = status === 'incomplete' || status === 'not-required'
          const { icon, i18nKey } = STATUS_CONFIG[status]

          return (
            <li key={day.value} className={styles.dayItem}>
              <button
                type='button'
                className={clsx(styles.dayToggle, isMuted && styles.muted)}
                aria-label={t('HabitItem.dayToggle', {
                  date: day.format('MMMM d'),
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
      <Meter.Root
        className={styles.strength}
        aria-label={t('HabitItem.strength')}
        min={0}
        max={100}
        value={strength}
      >
        <Meter.Track className={styles.strengthTrack}>
          <Meter.Indicator className={styles.strengthBar} />
        </Meter.Track>
      </Meter.Root>
    </article>
  )
}
