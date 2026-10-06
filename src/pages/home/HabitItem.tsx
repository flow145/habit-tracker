import { Meter } from '@base-ui/react/meter'
import { clsx } from 'clsx'
import { Check, ChevronRight, Squircle } from 'lucide-react'
import { type ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'wouter'

import {
  buildComputedEntries,
  type ComputedStatus,
  calculateStrength,
  getNextStatus,
  toggleDay,
  useHabitStore,
} from '~/entities/habit'
import { Day, type DayString, isErrorNamed } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { showSnackbar } from '~/shared/ui/Snackbar'

import styles from './HabitItem.module.css'
import SquircleCheckIcon from './squircle-check.svg'
import type { DayRange } from './types'

const PERCENTAGE_SCALE = 100

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
  const entries = useHabitStore((state) => state.entriesByHabitId[habitId] ?? {})

  const { computedEntriesInRange, strength } = useMemo(() => {
    if (!habit) return { computedEntriesInRange: [], strength: 0 }

    const start = new Day(
      Object.values(entries).reduce<DayString>(
        (start, { day }) => (day < start ? day : start),
        range.start.value,
      ),
    )

    const computedEntries = buildComputedEntries({
      start,
      end: range.end,
      entries,
      schedule: habit.schedule,
    })

    const computedEntriesInRange = computedEntries.filter(({ day }) => day >= range.start)
    const strength =
      (calculateStrength(computedEntries, habit.schedule).at(-1) ?? 0) * PERCENTAGE_SCALE

    return { computedEntriesInRange, strength }
  }, [habit, entries, range.start, range.end])

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
      <Link className={styles.link} to={`${Path.EditHabit}/${habit.id}`}>
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
