import { ScrollArea } from '@base-ui/react/scroll-area'
import { useVirtualizer } from '@tanstack/react-virtual'
import { clsx } from 'clsx'
import { SquarePen } from 'lucide-react'
import { type CSSProperties, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { buildComputedEntries, useHabitStore } from '~/entities/habit'
import { Day, useCurrentDay } from '~/shared/lib'
import { Button } from '~/shared/ui/Button'

import styles from './CompletionHistory.module.css'

const FIRST_DAY_OF_WEEK = 1
const DAYS_IN_WEEK = 7
const DAY_SIZE = 24
const DAY_GAP = 2
const WEEK_WIDTH = DAY_SIZE + DAY_GAP
const LOAD_MORE_THRESHOLD = 100
const INITIAL_YEARS = 2
const YEARS_PER_LOAD = 1
const EMPTY_ENTRIES = {}

const firstWeekday = new Day().startOfWeek(FIRST_DAY_OF_WEEK)
const weekdayLabels = Day.eachDayOfInterval(
  firstWeekday,
  firstWeekday.add({ days: DAYS_IN_WEEK - 1 }),
).map((day) => day.format('EEE'))

const getYearStart = (year: number) =>
  Day.fromParts({ year, month: 0, day: 1 }).startOfWeek(FIRST_DAY_OF_WEEK)

const getYearEnd = (year: number, today: Day) =>
  year === today.year ? today : getYearStart(year + 1).subtract({ days: 1 })

const getYearWidth = (year: number, today: Day) => {
  const start = getYearStart(year)
  const end = getYearEnd(year, today)
  return Math.ceil((end.differenceInDays(start) + 1) / DAYS_IN_WEEK) * WEEK_WIDTH
}

interface YearGridProps {
  habitId: string
  year: number
  style: CSSProperties
}

const YearGrid = ({ habitId, year, style }: YearGridProps) => {
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
      <span className={clsx(styles.yearLabel, 'hint')}>{year}</span>
      <div className={styles.dayGrid}>
        {computedEntries.map(({ day, status }) => (
          <span
            key={day.value}
            className={clsx(styles.day, 'hint')}
            data-status={status}
            role='img'
            aria-label={t('HabitDetails.completionHistory.day', {
              date: day.format('MMMM d, yyyy'),
              status: t(`HabitItem.dayStatus.${status}`),
            })}
          >
            {day.dayOfMonth}
          </span>
        ))}
      </div>
      <div className={clsx(styles.monthLabels, 'hint')}>
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

export const CompletionHistory = ({ habitId }: { habitId: string }) => {
  const { t } = useTranslation()
  const today = useCurrentDay()
  const currentYear = today.year
  const [oldestLoadedYear, setOldestLoadedYear] = useState(currentYear - INITIAL_YEARS + 1)
  const isPrepending = useRef(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  const getItemKey = useCallback((index: number) => oldestLoadedYear + index, [oldestLoadedYear])

  const virtualizer = useVirtualizer({
    count: currentYear - oldestLoadedYear + 1,
    getScrollElement: () => viewportRef.current,
    estimateSize: (index) => getYearWidth(oldestLoadedYear + index, today),
    getItemKey,
    horizontal: true,
    anchorTo: 'end',
    overscan: 1,
  })

  useLayoutEffect(() => {
    virtualizer.scrollToEnd()
  }, [virtualizer])

  useLayoutEffect(() => {
    virtualizer.measure()
  }, [today.value, virtualizer])

  useLayoutEffect(() => {
    isPrepending.current = false
  }, [oldestLoadedYear])

  const loadMore = () => {
    if (isPrepending.current || !viewportRef.current || oldestLoadedYear <= 1) return
    if (viewportRef.current.scrollLeft > LOAD_MORE_THRESHOLD) return

    isPrepending.current = true
    setOldestLoadedYear((year) => year - YEARS_PER_LOAD)
  }

  return (
    <section className={styles.history}>
      <div className={styles.header}>
        <h3 className='subheading'>{t('HabitDetails.completionHistory.title')}</h3>
        <Button variant='ghost' icon={<SquarePen />}>
          {t('HabitDetails.completionHistory.edit')}
        </Button>
      </div>
      <div className={styles.calendar}>
        <div className={clsx(styles.weekdays, 'hint')}>
          {weekdayLabels.map((weekday) => (
            <div className={styles.weekday} key={weekday}>
              {weekday}
            </div>
          ))}
        </div>
        <ScrollArea.Root className={styles.scrollArea}>
          <ScrollArea.Viewport
            ref={viewportRef}
            className={styles.viewport}
            aria-label={t('HabitDetails.completionHistory.calendar')}
            onScroll={loadMore}
          >
            <ScrollArea.Content
              className={styles.content}
              style={{ width: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((item) => (
                <YearGrid
                  key={item.key}
                  habitId={habitId}
                  year={oldestLoadedYear + item.index}
                  style={{ left: item.start, width: item.size }}
                />
              ))}
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <div className={styles.focusArea} aria-hidden />
        </ScrollArea.Root>
      </div>
    </section>
  )
}
