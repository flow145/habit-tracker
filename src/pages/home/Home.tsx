import { Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useHabitStore } from '~/entities/habit'
import { usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Header } from '~/shared/ui/Header'

import { HabitItem } from './HabitItem'
import styles from './Home.module.css'
import { Timeline } from './Timeline'
import { useTimelineRange } from './useTimelineRange'

export const Home = () => {
  const { t } = useTranslation()
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)
  const habits = useHabitStore((state) => state.habits)
  const range = useTimelineRange()

  usePageTitle(t('Home.title'))

  return (
    <>
      <Header
        title={t('Home.title')}
        endSlot={
          <>
            <Button variant='ghost' responsive icon={<Plus />} as='Link' to={Path.AddHabit}>
              {t('Home.addHabit')}
            </Button>
            <Button
              variant='ghost'
              icon={<Settings />}
              as='Link'
              to={Path.Settings}
              aria-label={t('Home.settings')}
            />
          </>
        }
      />
      <main className={styles.main}>
        {hydrationStatus === 'ready' && habits.length === 0 && (
          <main className={styles.empty}>
            <h2 className='subheading'>{t('Home.empty')}</h2>
            <Button icon={<Plus />} as='Link' to={Path.AddHabit}>
              {t('Home.addHabit')}
            </Button>
          </main>
        )}
        {hydrationStatus === 'ready' && habits.length > 0 && (
          <>
            <Timeline start={range.start} end={range.end} />
            <ul className={styles.habitList}>
              {habits.map((habit) => (
                <li key={habit.id}>
                  <HabitItem habitId={habit.id} range={range} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  )
}
