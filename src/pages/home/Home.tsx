import { Plus, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  type ComputedStatus,
  getHabitList,
  type HabitWithComputedEntries,
  toggleDay,
} from '~/features/habit'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Path } from '~/shared/constants'
import { usePageTitle } from '~/shared/hooks'

import { HabitItem } from './HabitItem'
import styles from './Home.module.css'
import { getTimelineStart, Timeline } from './Timeline'

export const Home = () => {
  const { t } = useTranslation()
  const [habits, setHabits] = useState<HabitWithComputedEntries[]>([])

  useEffect(() => {
    getHabitList({ start: getTimelineStart() }).then(setHabits)
  }, [])

  usePageTitle(t('Home.title'))

  const handleToggleDay = (habitId: string) => async (day: Date, currentStatus: ComputedStatus) => {
    await toggleDay({ habitId, day, currentStatus })
    setHabits(await getHabitList({ start: getTimelineStart() }))
  }

  return (
    <>
      <Header
        title={t('Home.title')}
        endSlot={
          <>
            <Button variant='ghost' responsive icon={<Plus />} as='Link' to={Path.AddHabit}>
              {t('Home.addHabit')}
            </Button>
            <Button variant='ghost' icon={<Settings />} aria-label={t('Home.settings')} />
          </>
        }
      />
      <main className={styles.main}>
        {habits.length > 0 && <Timeline />}
        <ul className={styles.habitList}>
          {habits.map((habit) => (
            <li key={habit.id}>
              <HabitItem habit={habit} onToggleDay={handleToggleDay(habit.id)} />
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
