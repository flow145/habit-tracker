import { differenceInCalendarDays, min } from 'date-fns'
import { v7 as uuidv7 } from 'uuid'
import {
  EntityConflictError,
  EntityNotFoundError,
  type Entry,
  getDb,
  type Habit,
  type Schedule,
} from '~/shared/db'
import { groupBy, isErrorNamed } from '~/shared/lib'
import { buildComputedEntries, type ComputedEntry, getWindowStart } from './computed-entries'

export interface HabitWithEntries extends Habit {
  entries: ComputedEntry[]
}

export const addHabit = async ({
  name,
  description,
  schedule,
}: {
  name: string
  description?: string
  schedule: Schedule
}): Promise<Habit> => {
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
    await db.add('habits', habit)
  } catch (error) {
    if (isErrorNamed(error, 'ConstraintError'))
      throw new EntityConflictError('Habit', { id }, { cause: error })
    throw error
  }

  return habit
}

export const getHabitList = async ({
  start,
  end = new Date(),
}: {
  start: Date
  end?: Date
}): Promise<HabitWithEntries[]> => {
  const db = await getDb()
  const tx = db.transaction(['habits', 'entries'], 'readonly')
  const habits = await tx.objectStore('habits').index('byCreatedAt').getAll()

  const dayCount = differenceInCalendarDays(end, start) + 1

  if (habits.length === 0 || dayCount <= 0) {
    await tx.done
    return habits.map((habit) => ({ ...habit, entries: [] }))
  }

  const earliestEffectiveStart = min(habits.map((habit) => getWindowStart(start, habit.schedule)))

  const entries = await tx
    .objectStore('entries')
    .index('byDay')
    .getAll(IDBKeyRange.bound(earliestEffectiveStart, end))

  const entriesByHabit = groupBy(entries, (entry) => entry.habitId)

  const list = habits.map((habit) => ({
    ...habit,
    entries: buildComputedEntries({
      start,
      end,
      entries: entriesByHabit.get(habit.id) ?? [],
      schedule: habit.schedule,
    }),
  }))

  await tx.done
  return list
}

export const editHabit = async ({
  id,
  name,
  description,
  schedule,
}: {
  id: string
  name?: string
  description?: string
  schedule?: Schedule
}): Promise<Habit> => {
  const db = await getDb()
  const tx = db.transaction('habits', 'readwrite')
  const existing = await tx.store.get(id)

  if (!existing) {
    await tx.done
    throw new EntityNotFoundError('Habit', id)
  }

  const updated: Habit = {
    ...existing,
    name: name ?? existing.name,
    description: description ?? existing.description,
    schedule: schedule ?? existing.schedule,
    updatedAt: new Date(),
  }

  try {
    await tx.store.put(updated)
    await tx.done
  } catch (error) {
    if (isErrorNamed(error, 'ConstraintError'))
      throw new EntityConflictError('Habit', { id }, { cause: error })
    throw error
  }

  return updated
}

export const deleteHabit = async (id: string): Promise<void> => {
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
}

export const setStatus = async ({
  habitId,
  day,
  status,
}: {
  habitId: string
  day: Date
  status: 'complete' | 'incomplete'
}): Promise<void> => {
  const db = await getDb()

  if (status === 'complete') {
    const id = uuidv7()
    const now = new Date()

    const entry: Entry = {
      id,
      habitId,
      status: 'complete',
      day,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await db.add('entries', entry)
    } catch (error) {
      if (isErrorNamed(error, 'ConstraintError')) return
      throw error
    }
  }

  if (status === 'incomplete') {
    const tx = db.transaction('entries', 'readwrite')
    const existing = await tx.store.index('byHabitAndDay').get([habitId, day])

    if (!existing) {
      await tx.done
      return
    }

    await tx.store.delete(existing.id)
    await tx.done
  }
}
