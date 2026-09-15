import { Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useHabitStore } from '~/features/habit'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Path } from '~/shared/constants'
import { usePageTitle } from '~/shared/hooks'

import { HabitItem } from './HabitItem'
import styles from './Home.module.css'
import { Timeline } from './Timeline'
import { useTimelineRange } from './useTimelineRange'

export const Home = () => {
  const { t } = useTranslation()
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)
  const habitIds = useHabitStore((state) => state.habitIds)
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
        {hydrationStatus === 'ready' && habitIds.length === 0 && (
          <main className={styles.empty}>
            <h2 className='subheading'>{t('Home.empty')}</h2>
            <Button icon={<Plus />} as='Link' to={Path.AddHabit}>
              {t('Home.addHabit')}
            </Button>
          </main>
        )}
        {hydrationStatus === 'ready' && habitIds.length > 0 && (
          <>
            <Timeline start={range.start} end={range.end} />
            <ul className={styles.habitList}>
              {habitIds.map((habitId) => (
                <li key={habitId}>
                  <HabitItem habitId={habitId} range={range} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  )
}
