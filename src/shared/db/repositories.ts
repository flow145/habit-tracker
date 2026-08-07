import { v7 as uuidv7 } from 'uuid'

import { toISODate } from '~/shared/lib'
import { getDb } from './client'
import { RecordAlreadyExistsError, RecordNotFoundError } from './errors'
import type { Completion, Habit, ISODate, Schedule } from './schema'

interface CreateHabitParams {
  name: string
  description?: string
  schedule: Schedule
}

interface UpdateHabitParams {
  id: string
  name?: string
  description?: string
  schedule?: Schedule
}

interface CreateCompletionParams {
  habitId: string
  date: ISODate
}

export const repositories = {
  habits: {
    async create({ name, description, schedule }: CreateHabitParams) {
      const db = await getDb()
      const id = uuidv7()
      const now = new Date()

      const habit: Habit = {
        id,
        name,
        description: description ?? '',
        schedule,
        createdAt: now,
        updatedAt: now,
      }

      try {
        return await db.add('habits', habit)
      } catch (error) {
        if (error instanceof Error && error.name === 'ConstraintError')
          throw new RecordAlreadyExistsError('Habit', id, { cause: error })
      }
    },

    async findById(id: string) {
      const db = await getDb()
      return db.get('habits', id)
    },

    async findAll() {
      const db = await getDb()
      return db.getAllFromIndex('habits', 'byCreatedAt')
    },

    async update({ id, name, description, schedule }: UpdateHabitParams) {
      const db = await getDb()
      const tx = db.transaction('habits', 'readwrite')
      const existing = await tx.store.get(id)

      if (!existing) {
        await tx.done
        throw new RecordNotFoundError('Habit', id)
      }

      const updated: Habit = {
        ...existing,
        name: name ?? existing.name,
        description: description ?? existing.description,
        schedule: schedule ?? existing.schedule,
        updatedAt: new Date(),
      }

      const habitId = await tx.store.put(updated)
      await tx.done
      return habitId
    },

    async markDeleted(id: string) {
      const db = await getDb()
      const tx = db.transaction('habits', 'readwrite')
      const existing = await tx.store.get(id)

      if (!existing) {
        await tx.done
        throw new RecordNotFoundError('Habit', id)
      }

      const updated: Habit = {
        ...existing,
        deletedAt: new Date(),
      }

      const key = await tx.store.put(updated)
      await tx.done
      return key
    },

    async deletePermanently(id: string) {
      const db = await getDb()
      return db.delete('habits', id)
    },
  },

  completions: {
    async create({ habitId, date }: CreateCompletionParams) {
      const db = await getDb()
      const id = uuidv7()
      const now = new Date()

      const completion: Completion = {
        id,
        habitId,
        status: 'complete',
        date,
        createdAt: now,
        updatedAt: now,
      }

      try {
        return await db.add('completions', completion)
      } catch (error) {
        if (error instanceof Error && error.name === 'ConstraintError')
          throw new RecordAlreadyExistsError('Completion', id, { cause: error })
      }
    },

    async findByHabit(habitId: string) {
      const db = await getDb()
      const tx = db.transaction('completions')
      const index = tx.store.index('byHabitAndDate')

      const completions: Completion[] = []
      const range = IDBKeyRange.bound(
        [habitId, toISODate(new Date(0))],
        [habitId, toISODate(new Date())],
      )

      let cursor = await index.openCursor(range, 'prev')

      while (cursor) {
        completions.push(cursor.value)
        cursor = await cursor.continue()
      }

      await tx.done
      return completions
    },

    async delete(id: string) {
      const db = await getDb()
      return db.delete('completions', id)
    },
  },
}
