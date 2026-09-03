import type { DBSchema as IDBSchema } from 'idb'

export type IntervalUnit = 'days' | 'weeks' | 'months'
export type ExplicitStatus = 'complete'

export interface Schedule {
  frequency: number
  interval: number
  intervalUnit: IntervalUnit
}

export interface Habit {
  id: string
  name: string
  description: string
  schedule: Schedule
  createdAt: Date
  updatedAt: Date
}

export interface Entry {
  id: string
  habitId: string
  status: ExplicitStatus
  day: Date
  createdAt: Date
  updatedAt: Date
}

export interface DBSchema extends IDBSchema {
  habits: {
    key: string
    value: Habit
    indexes: {
      byCreatedAt: string
    }
  }
  entries: {
    key: string
    value: Entry
    indexes: {
      byDay: Date
      byHabitAndDay: [string, Date]
    }
  }
}
