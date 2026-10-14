import { clsx } from 'clsx'
import { type CSSProperties, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { buildComputedEntries, useHabitStore } from '~/entities/habit'
import { Day, useCurrentDay } from '~/shared/lib'

import styles from './YearGrid.module.css'

export const FIRST_DAY_OF_WEEK = 1
export const DAYS_IN_WEEK = 7
const DAY_SIZE = 24
const DAY_GAP = 2
const WEEK_WIDTH = DAY_SIZE + DAY_GAP
const EMPTY_ENTRIES = {}

const getYearStart = (year: number) =>
  Day.fromParts({ year, month: 0, day: 1 }).startOfWeek(FIRST_DAY_OF_WEEK)

const getYearEnd = (year: number, today: Day) =>
  year === today.year ? today : getYearStart(year + 1).subtract({ days: 1 })

export const getYearWidth = (year: number, today: Day) => {
  const start = getYearStart(year)
  const end = getYearEnd(year, today)
  return Math.ceil((end.differenceInDays(start) + 1) / DAYS_IN_WEEK) * WEEK_WIDTH
}

interface YearGridProps {
  habitId: string
  year: number
  style: CSSProperties
}

export const YearGrid = ({ habitId, year, style }: YearGridProps) => {
  const { t } = useTranslation()
  const habit = useHabitStore((state) => state.habitsById[habitId])
  const entries = useHabitStore((state) => state.entriesByHabitId[habitId] ?? EMPTY_ENTRIES)
  const today = useCurrentDay()
  const start = getYearStart(year)
  const end = getYearEnd(year, today)
  const color = habit?.color ?? 'neutral'

  const computedEntries = useMemo(
    () => (habit ? buildComputedEntries({ start, end, entries, schedule: habit.schedule }) : []),
    [start.value, end.value, entries, habit],
  )

  return (
    <div
      className={styles.year}
      style={{
        ...style,
        '--not-required-color': `var(--${color}-3)`,
        '--complete-color': `var(--${color}-6)`,
      }}
    >
      <h4 className={clsx(styles.yearLabel, 'hint')}>{year}</h4>
      <ol className={styles.dayGrid}>
        {computedEntries.map(({ day, status }) => (
          <li
            key={day.value}
            className={clsx(styles.day, 'hint')}
            data-status={status}
            aria-label={t('HabitDetails.completionHistory.day', {
              date: day.format('MMMM d, yyyy'),
              status: t(`HabitItem.dayStatus.${status}`),
            })}
          >
            {day.dayOfMonth}
          </li>
        ))}
      </ol>
      <div className={clsx(styles.monthLabels, 'hint')} aria-hidden>
        {computedEntries
          .filter(({ day }) => day.dayOfMonth === 1)
          .map(({ day }) => (
            <span
              key={day.value}
              className={styles.month}
              style={{ left: Math.floor(day.differenceInDays(start) / DAYS_IN_WEEK) * WEEK_WIDTH }}
            >
              {day.format('MMM')}
            </span>
          ))}
      </div>
    </div>
  )
}
