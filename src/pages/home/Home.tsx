import { subDays } from 'date-fns'
import { Plus, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getHabitList, type HabitWithEntries, setStatus } from '~/features/habit'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { usePageTitle } from '~/shared/hooks'

import { HabitItem } from './HabitItem'
import styles from './Home.module.css'

const MAX_DAYS = 10

const getDateRange = () => ({ start: subDays(new Date(), MAX_DAYS - 1) })

export const Home = () => {
  const { t } = useTranslation()
  const [habits, setHabits] = useState<HabitWithEntries[]>([])

  useEffect(() => {
    getHabitList(getDateRange()).then(setHabits)
  }, [])

  usePageTitle(t('Home.title'))

  const handleToggleDay =
    (habitId: string) => async (day: Date, status: 'complete' | 'incomplete') => {
      await setStatus({ habitId, day, status })
      setHabits(await getHabitList(getDateRange()))
    }

  return (
    <>
      <Header
        title={t('Home.title')}
        endSlot={
          <>
            <Button variant='ghost' icon={<Plus />} aria-label={t('Home.addHabit')} />
            <Button variant='ghost' icon={<Settings />} aria-label={t('Home.settings')} />
          </>
        }
      />
      <main className={styles.main}>
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
