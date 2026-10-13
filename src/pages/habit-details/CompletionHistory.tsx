import { ScrollArea } from '@base-ui/react/scroll-area'
import { useVirtualizer } from '@tanstack/react-virtual'
import { clsx } from 'clsx'
import { addDays, eachDayOfInterval, format, startOfWeek } from 'date-fns'
import { SquarePen } from 'lucide-react'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '~/shared/ui/Button'
import styles from './CompletionHistory.module.css'

const YEAR_WIDTH = 1000
const LOAD_MORE_THRESHOLD = 100
const YEARS_PER_LOAD = 1

const firstWeekday = startOfWeek(new Date(), { weekStartsOn: 1 })
const weekdays = eachDayOfInterval({
  start: firstWeekday,
  end: addDays(firstWeekday, 6),
}).map((day) => format(day, 'EEE'))

export const CompletionHistory = () => {
  const { t } = useTranslation()
  const lastYear = new Date().getFullYear()
  const [oldestLoadedYear, setOldestLoadedYear] = useState(lastYear - YEARS_PER_LOAD + 1)
  const isPrepending = useRef(false)
  const viewportRef = useRef<HTMLDivElement>(null)

  const getItemKey = useCallback((index: number) => oldestLoadedYear + index, [oldestLoadedYear])

  const virtualizer = useVirtualizer({
    count: lastYear - oldestLoadedYear + 1,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => YEAR_WIDTH,
    getItemKey,
    horizontal: true,
    anchorTo: 'end',
    overscan: 1,
  })

  useLayoutEffect(() => {
    virtualizer.scrollToEnd()
  }, [virtualizer])

  useLayoutEffect(() => {
    isPrepending.current = false
  }, [oldestLoadedYear])

  const loadMore = () => {
    if (isPrepending.current || !viewportRef.current) return
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
          {weekdays.map((weekday) => (
            <div className={styles.weekday} key={weekday}>
              {weekday}
            </div>
          ))}
        </div>
        <ScrollArea.Root className={styles.scrollArea}>
          <ScrollArea.Viewport
            ref={viewportRef}
            className={styles.viewport}
            aria-label={t('HabitDetails.completionHistory.years')}
            onScroll={loadMore}
          >
            <ScrollArea.Content
              className={styles.content}
              style={{ width: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((item) => {
                const year = oldestLoadedYear + item.index
                return (
                  <div
                    key={item.key}
                    className={styles.year}
                    style={{ left: item.start, width: item.size }}
                  >
                    <span className={clsx(styles.yearLabel, 'hint')}>{year}</span>
                    <div className={styles.yearBlock} data-tone={year % 2 === 0 ? 'even' : 'odd'}>
                      {year}
                    </div>
                  </div>
                )
              })}
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <div className={styles.focusArea} aria-hidden />
        </ScrollArea.Root>
      </div>
    </section>
  )
}
