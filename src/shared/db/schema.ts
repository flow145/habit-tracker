import type { DBSchema as IDBSchema } from 'idb'

export type InvtervalUnit = 'days' | 'weeks' | 'months'
export type CompletionStatus = 'complete'

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
  completions: {
    key: string
    value: Completion
    indexes: {
      byDay: Date
      byHabitAndDay: [string, Date]
    }
  }
}
