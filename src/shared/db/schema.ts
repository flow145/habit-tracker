import type { DBSchema as IDBSchema } from 'idb'

export type InvtervalUnit = 'day' | 'week' | 'month'
export type CompletionStatus = 'complete'
/** yyyy-MM-dd date-fns pattern */
export type ISODate = string

export interface Schedule {
  frequency: number
  interval: number
  intervalUnit: InvtervalUnit
}

export interface Habit {
  id: string
  name: string
  description: string
  schedule: Schedule
  createdAt: Date
  updatedAt: Date
}

export interface Completion {
  id: string
  habitId: string
  status: CompletionStatus
  date: ISODate
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
  completions: {
    key: string
    value: Completion
    indexes: {
      byHabitAndDate: [string, ISODate]
    }
  }
}
