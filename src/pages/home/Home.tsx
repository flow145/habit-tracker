import { Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useHabitStore } from '~/entities/habit'
import { useCurrentDay, usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Layout } from '~/shared/ui/Layout'

import { HabitItem } from './HabitItem'
import styles from './Home.module.css'
import { Timeline } from './Timeline'

const DAYS_TO_DISPLAY = 10

export const Home = () => {
  const { t } = useTranslation()
  const hydrationStatus = useHabitStore((state) => state.hydrationStatus)
  const habitsById = useHabitStore((state) => state.habitsById)
  const end = useCurrentDay()
  const start = end.subtract({ days: DAYS_TO_DISPLAY - 1 })
  const range = { start, end }
  const habits = Object.values(habitsById).sort(
    (first, second) => first.createdAt.getTime() - second.createdAt.getTime(),
  )

  usePageTitle(t('Home.title'))

  return (
    <Layout
      title={t('Home.title')}
      compact
      endSlot={
        <>
          <Button
            variant='ghost'
            icon={<Plus />}
            as='Link'
            to={Path.AddHabit}
            aria-label={t('Home.addHabit')}
          />
          <Button
            variant='ghost'
            icon={<Settings />}
            as='Link'
            to={Path.Settings}
            aria-label={t('Home.settings')}
          />
        </>
      }
    >
      {hydrationStatus === 'ready' && habits.length === 0 && (
        <div className={styles.empty}>
          <h2 className='subheading'>{t('Home.empty')}</h2>
          <Button icon={<Plus />} as='Link' to={Path.AddHabit}>
            {t('Home.addHabit')}
          </Button>
        </div>
      )}
      {hydrationStatus === 'ready' && habits.length > 0 && (
        <div className={styles.content}>
          <Timeline range={range} />
          <ul className={styles.habitList}>
            {habits.map((habit) => (
              <li key={habit.id}>
                <HabitItem habitId={habit.id} range={range} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Layout>
  )
}
