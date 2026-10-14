import { Meter } from '@base-ui/react/meter'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { Check, ChevronLeft, SquarePen } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoute } from 'wouter'

import { useHabitData, useHabitStore } from '~/entities/habit'
import { usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Dialog } from '~/shared/ui/Dialog'
import { Header } from '~/shared/ui/Header'

import { CompletionCalendar } from './CompletionCalendar'
import styles from './HabitDetails.module.css'

const historyDialog = Dialog.createHandle()

export const HabitDetails = () => {
  const { t } = useTranslation()
  const calendarViewportRef = useRef<HTMLDivElement>(null)
  const [, params] = useRoute('/:id')
  const habitId = params?.id ?? ''
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)
  const habit = useHabitStore((state) => state.habitsById[habitId])
  const { strengths } = useHabitData(habitId)
  const strength = Math.round((strengths.at(-1) ?? 0) * 100)

  usePageTitle(t('HabitDetails.title'))

  const header = (
    <Header
      title={t('HabitDetails.title')}
      startSlot={
        <Button
          variant='ghost'
          icon={<ChevronLeft />}
          as='Link'
          to={Path.Home}
          aria-label={t('shared.back')}
        />
      }
      endSlot={
        <Button
          variant='ghost'
          icon={<SquarePen />}
          as='Link'
          to={`${Path.EditHabit}/${habitId}`}
          aria-label={t('EditHabit.title')}
        />
      }
    />
  )

  if (hydrationStatus !== 'ready') return header

  if (!habit)
    return (
      <>
        {header}
        <main className={styles.empty}>
          <h2 className='subheading'>{t('EditHabit.empty.text')}</h2>
          <Button as='Link' to={Path.Home}>
            {t('EditHabit.empty.button')}
          </Button>
        </main>
      </>
    )

  const { frequency, interval, intervalUnit } = habit.schedule
  const schedule = t('HabitDetails.schedule.summary', {
    frequency: t('HabitDetails.schedule.frequency', { count: frequency }),
    interval: t(`HabitDetails.schedule.interval.${intervalUnit}`, { count: interval }),
  })

  const colors = {
    '--bar-color': `var(--${habit.color}-8)`,
    '--name-color': `var(--${habit.color}-12)`,
    '--percentage-color': `var(--${habit.color}-10)`,
  }

  return (
    <>
      {header}
      <main className={styles.main} style={colors}>
        <div className={styles.container}>
          <div className={styles.details}>
            <div className={styles.colorBar} />
            <h2 className={clsx(styles.name, 'heading')}>{habit.name}</h2>
            <p className='body'>{schedule}</p>
            <p className={clsx(styles.created, 'hint')}>
              {t('HabitDetails.created', {
                date: format(habit.createdAt, 'MMMM d, yyyy'),
              })}
            </p>
          </div>
          <Meter.Root className={styles.strength} min={0} max={100} value={strength}>
            <Meter.Label className='body'>
              {t('HabitDetails.strength')}{' '}
              <span className={clsx(styles.percentage, 'label')}>{strength}%</span>
            </Meter.Label>
            <Meter.Track className={styles.strengthTrack}>
              <Meter.Indicator className={styles.strengthBar} />
            </Meter.Track>
          </Meter.Root>
          {habit.notes && <p className={clsx(styles.notes, 'body')}>{habit.notes}</p>}
          <section className={styles.history}>
            <div className={styles.historyHeader}>
              <h3 className='subheading'>{t('HabitDetails.completionHistory.title')}</h3>
              <Dialog.Trigger handle={historyDialog}>
                <Button variant='ghost' icon={<SquarePen />}>
                  {t('HabitDetails.completionHistory.edit')}
                </Button>
              </Dialog.Trigger>
            </div>
            <CompletionCalendar habitId={habitId} />
          </section>
        </div>
      </main>
      <Dialog
        title={t('HabitDetails.completionHistory.editDialogTitle')}
        handle={historyDialog}
        initialFocus={calendarViewportRef}
      >
        <div className={styles.historyDialog}>
          <div className={styles.historyDialogText}>
            <Dialog.Title className='title'>
              {t('HabitDetails.completionHistory.editDialogTitle')}
            </Dialog.Title>
            <p className='body'>{habit.name}</p>
          </div>
          <div className={styles.historyDialogCalendar}>
            <CompletionCalendar habitId={habitId} mode='edit' viewportRef={calendarViewportRef} />
          </div>
          <div className={styles.historyDialogActions}>
            <Dialog.Close>
              <Button icon={<Check />}>{t('shared.done')}</Button>
            </Dialog.Close>
          </div>
        </div>
      </Dialog>
    </>
  )
}
