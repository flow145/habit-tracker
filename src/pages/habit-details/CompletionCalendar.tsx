import { ScrollArea } from '@base-ui/react/scroll-area'
import { useVirtualizer } from '@tanstack/react-virtual'
import { clsx } from 'clsx'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Day, useCurrentDay } from '~/shared/lib'

import styles from './CompletionCalendar.module.css'
import { DAYS_IN_WEEK, FIRST_DAY_OF_WEEK, getYearWidth, YearGrid } from './YearGrid'

const LOAD_MORE_THRESHOLD = 100
const INITIAL_YEARS = 2
const YEARS_PER_LOAD = 1

const firstWeekday = new Day().startOfWeek(FIRST_DAY_OF_WEEK)
const weekdayLabels = Day.eachDayOfInterval(
  firstWeekday,
  firstWeekday.add({ days: DAYS_IN_WEEK - 1 }),
).map((day) => day.format('EEE'))

export interface CompletionCalendarProps {
  habitId: string
}

export const CompletionCalendar = ({ habitId }: CompletionCalendarProps) => {
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

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    let previousWidth = viewport.clientWidth
    const resizeObserver = new ResizeObserver(() => {
      const width = viewport.clientWidth
      if (width === previousWidth) return

      const previousMaxScrollLeft = Math.max(0, viewport.scrollWidth - previousWidth)
      if (Math.abs(viewport.scrollLeft - previousMaxScrollLeft) <= 1)
        viewport.scrollLeft = Math.max(0, viewport.scrollWidth - width)

      previousWidth = width
    })

    resizeObserver.observe(viewport)
    return () => resizeObserver.disconnect()
  }, [])

  const loadMore = () => {
    if (isPrepending.current || !viewportRef.current || oldestLoadedYear <= 1) return
    if (viewportRef.current.scrollLeft > LOAD_MORE_THRESHOLD) return

    isPrepending.current = true
    setOldestLoadedYear((year) => year - YEARS_PER_LOAD)
  }

  return (
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
  )
}
