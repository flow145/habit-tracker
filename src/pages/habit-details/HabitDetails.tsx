import { Meter } from '@base-ui/react/meter'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { ChevronLeft, Pen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRoute } from 'wouter'
import { useHabitData, useHabitStore } from '~/entities/habit'
import { usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Header } from '~/shared/ui/Header'
import styles from './HabitDetails.module.css'

export const HabitDetails = () => {
  const { t } = useTranslation()
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
          icon={<Pen />}
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
        </div>
      </main>
    </>
  )
}
