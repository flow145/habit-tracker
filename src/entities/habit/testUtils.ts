import type { Entry, Habit } from '~/shared/api'
import type { Day } from '~/shared/lib'
import { date, day } from '~/shared/tests'

export const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Read',
  description: '',
  schedule: { frequency: 1, interval: 1, intervalUnit: 'days' },
  createdAt: date(1),
  updatedAt: date(1),
  ...overrides,
})

type EntryOverrides = Omit<Partial<Entry>, 'day'> & { day?: Day | Entry['day'] }

export const makeEntry = ({
  day: entryDay = day(1),
  ...overrides
}: EntryOverrides = {}): Entry => ({
  id: 'entry-1',
  habitId: 'habit-1',
  status: 'complete',
  day: typeof entryDay === 'string' ? entryDay : entryDay.value,
  createdAt: date(1),
  updatedAt: date(1),
  ...overrides,
})
