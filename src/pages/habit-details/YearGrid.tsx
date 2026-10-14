import { clsx } from 'clsx'
import { type CSSProperties, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { buildComputedEntries, getNextStatus, useHabitStore } from '~/entities/habit'
import { Day, useCurrentDay } from '~/shared/lib'

import styles from './YearGrid.module.css'

export const FIRST_DAY_OF_WEEK = 1
export const DAYS_IN_WEEK = 7
const DAY_SIZE = { view: 24, edit: 40 }
const DAY_GAP = { view: 2, edit: 4 }
const EMPTY_ENTRIES = {}

const getYearStart = (year: number) =>
  Day.fromParts({ year, month: 0, day: 1 }).startOfWeek(FIRST_DAY_OF_WEEK)

const getYearEnd = (year: number, today: Day) =>
  year === today.year ? today : getYearStart(year + 1).subtract({ days: 1 })

type Mode = 'view' | 'edit'

export const getYearWidth = (year: number, today: Day, mode: Mode = 'view') => {
  const start = getYearStart(year)
  const end = getYearEnd(year, today)
  const weekWidth = DAY_SIZE[mode] + DAY_GAP[mode]
  return Math.ceil((end.differenceInDays(start) + 1) / DAYS_IN_WEEK) * weekWidth
}

interface YearGridProps {
  habitId: string
  year: number
  mode: Mode
  onToggleDay: (day: Day) => void
  style: CSSProperties
}

export const YearGrid = ({ habitId, year, mode, onToggleDay, style }: YearGridProps) => {
  const { t } = useTranslation()
  const habit = useHabitStore((state) => state.habitsById[habitId])
  const entries = useHabitStore((state) => state.entriesByHabitId[habitId] ?? EMPTY_ENTRIES)
  const today = useCurrentDay()
  const start = getYearStart(year)
  const end = getYearEnd(year, today)
  const color = habit?.color ?? 'neutral'
  const labelTypography = mode === 'view' ? 'hint' : 'label'

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
      data-mode={mode}
    >
      <h4 className={clsx(styles.yearLabel, labelTypography)}>{year}</h4>
      <ol className={styles.dayGrid}>
        {computedEntries.map(({ day, status }) => {
          const statusLabel = t(`HabitItem.dayStatus.${status}`)

          return (
            <li
              className={styles.dayItem}
              key={day.value}
              aria-label={
                mode === 'view'
                  ? t('HabitDetails.completionHistory.day', {
                      date: day.format('MMMM d, yyyy'),
                      status: statusLabel,
                    })
                  : undefined
              }
            >
              {mode === 'view' && (
                <div className={clsx(styles.day, 'hint')} data-status={status}>
                  {day.dayOfMonth}
                </div>
              )}
              {mode === 'edit' && (
                <button
                  type='button'
                  className={clsx(styles.day, styles.editableDay, 'label')}
                  data-status={status}
                  aria-label={t('HabitItem.dayToggle', {
                    date: day.format('MMMM d, yyyy'),
                    currentStatus: statusLabel,
                    nextStatus: t(`HabitItem.dayStatus.${getNextStatus(status)}`),
                  })}
                  onClick={() => onToggleDay(day)}
                >
                  {day.dayOfMonth}
                </button>
              )}
            </li>
          )
        })}
      </ol>
      <div className={clsx(styles.monthLabels, labelTypography)} aria-hidden>
        {computedEntries
          .filter(({ day }) => day.dayOfMonth === 1)
          .map(({ day }) => {
            const weekColumnIndex = Math.floor(day.differenceInDays(start) / DAYS_IN_WEEK)
            const monthLabelCenterX =
              weekColumnIndex * (DAY_SIZE[mode] + DAY_GAP[mode]) + DAY_SIZE[mode] / 2

            return (
              <span key={day.value} className={styles.month} style={{ left: monthLabelCenterX }}>
                {day.format('MMM')}
              </span>
            )
          })}
      </div>
    </div>
  )
}
