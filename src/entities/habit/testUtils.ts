import type { Entry, Habit } from '~/shared/api'
import { date } from '~/shared/tests'

export const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit-1',
  name: 'Read',
  description: '',
  schedule: { frequency: 1, interval: 1, intervalUnit: 'days' },
  createdAt: date(1),
  updatedAt: date(1),
  ...overrides,
})

export const makeEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: 'entry-1',
  habitId: 'habit-1',
  status: 'complete',
  day: date(1),
  createdAt: date(1),
  updatedAt: date(1),
  ...overrides,
})
