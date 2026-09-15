import {
  EntityConflictError,
  EntityNotFoundError,
  type Entry,
  getDb,
  type Habit,
} from '~/shared/db'
import { isErrorNamed } from '~/shared/lib'

export interface HabitData {
  habits: Habit[]
  entries: Entry[]
}

export interface HabitRepository {
  loadData(): Promise<HabitData>
  addHabitRecord(habit: Habit): Promise<void>
  updateHabitRecord(habit: Habit): Promise<void>
  addEntryRecord(entry: Entry): Promise<void>
  deleteEntryRecord(input: { habitId: string; day: Date }): Promise<void>
  deleteHabitRecord(id: string): Promise<void>
}

export const repository: HabitRepository = {
  async loadData(): Promise<HabitData> {
    const db = await getDb()
    const tx = db.transaction(['habits', 'entries'], 'readonly')
    const habits = await tx.objectStore('habits').index('byCreatedAt').getAll()
    const entries = await tx.objectStore('entries').getAll()

    await tx.done
    return { habits, entries }
  },

  async addHabitRecord(habit) {
    const db = await getDb()

    try {
      await db.add('habits', habit)
    } catch (error) {
      if (isErrorNamed(error, 'ConstraintError'))
        throw new EntityConflictError('Habit', habit.id, { cause: error })
      throw error
    }
  },

  async updateHabitRecord(habit: Habit): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('habits', 'readwrite')
    const existing = await tx.store.get(habit.id)

    if (!existing) {
      await tx.done
      throw new EntityNotFoundError('Habit', habit.id)
    }

    try {
      await tx.store.put(habit)
      await tx.done
    } catch (error) {
      if (isErrorNamed(error, 'ConstraintError'))
        throw new EntityConflictError('Habit', habit.id, { cause: error })
      throw error
    }
  },

  async addEntryRecord(entry: Entry): Promise<void> {
    const db = await getDb()

    try {
      await db.add('entries', entry)
    } catch (error) {
      if (isErrorNamed(error, 'ConstraintError'))
        throw new EntityConflictError('Entry', entry.id, { cause: error })
      throw error
    }
  },

  async deleteEntryRecord({ habitId, day }: { habitId: string; day: Date }) {
    const db = await getDb()
    const tx = db.transaction('entries', 'readwrite')
    const existing = await tx.store.index('byHabitAndDay').get([habitId, day])

    if (!existing) {
      await tx.done
      return
    }

    await tx.store.delete(existing.id)
    await tx.done
  },

  async deleteHabitRecord(id: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['habits', 'entries'], 'readwrite')
    const habitsStore = tx.objectStore('habits')
    const entriesStore = tx.objectStore('entries')
    const existing = await habitsStore.get(id)

    if (!existing) {
      await tx.done
      throw new EntityNotFoundError('Habit', id)
    }

    const habitEntries = (await entriesStore.getAll()).filter((entry) => entry.habitId === id)

    await Promise.all([
      ...habitEntries.map((entry) => entriesStore.delete(entry.id)),
      habitsStore.delete(id),
      tx.done,
    ])
  },
}
