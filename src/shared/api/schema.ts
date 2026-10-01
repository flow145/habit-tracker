import type { DBSchema as IDBSchema } from 'idb'
import type { DayString } from '~/shared/lib'

export type IntervalUnit = 'days' | 'weeks' | 'months'
export type ExplicitStatus = 'complete'
export type HabitColor =
  | 'slate'
  | 'gold'
  | 'bronze'
  | 'brown'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'tomato'
  | 'red'
  | 'ruby'
  | 'crimson'
  | 'pink'
  | 'plum'
  | 'purple'
  | 'violet'
  | 'iris'
  | 'indigo'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'jade'
  | 'green'
  | 'grass'
  | 'lime'
  | 'mint'
  | 'sky'

export interface Schedule {
  frequency: number
  interval: number
  intervalUnit: IntervalUnit
}

export interface Habit {
  id: string
  name: string
  notes: string
  color: HabitColor
  schedule: Schedule
  createdAt: Date
  updatedAt: Date
}

export interface Entry {
  id: string
  habitId: string
  status: ExplicitStatus
  day: DayString
  createdAt: Date
  updatedAt: Date
}

export interface DBSchema extends IDBSchema {
  habits: {
    key: string
    value: Habit
  }
  entries: {
    key: string
    value: Entry
    indexes: {
      byDay: DayString
      byHabitAndDay: [string, DayString]
    }
  }
}
