import { max } from 'date-fns'
import { v7 as uuidv7 } from 'uuid'
import {
  type Completion,
  EntityConflictError,
  EntityNotFoundError,
  getDb,
  type Habit,
  type Schedule,
} from '~/shared/db'
import { groupBy, isErrorNamed } from '~/shared/lib'
import { buildHabitDays, type HabitDay } from './scheduling'

interface HabitWithDays extends Habit {
  days: HabitDay[]
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

export const getHabitList = async (): Promise<HabitWithDays[]> => {
  const db = await getDb()
  const tx = db.transaction(['habits', 'completions'], 'readonly')
  const habits = await tx.objectStore('habits').index('byCreatedAt').getAll()
  const completions = await tx.objectStore('completions').index('byDay').getAll()

  const completionsByHabit = groupBy(completions, (completion) => completion.habitId)
  const lastCompletionDate = completions.at(-1)?.day
  const end = lastCompletionDate ? max([new Date(), new Date(lastCompletionDate)]) : new Date()

  const habitsWithDays = habits.map((habit) => ({
    ...habit,
    days: buildHabitDays({
      start: habit.createdAt,
      end,
      completions: completionsByHabit.get(habit.id) ?? [],
      schedule: habit.schedule,
    }),
  }))

  await tx.done
  return habitsWithDays
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
  const tx = db.transaction(['habits', 'completions'], 'readwrite')
  const habitsStore = tx.objectStore('habits')
  const completionsStore = tx.objectStore('completions')
  const existing = await habitsStore.get(id)

  if (!existing) {
    await tx.done
    throw new EntityNotFoundError('Habit', id)
  }

  const habitCompletions = (await completionsStore.getAll()).filter(
    (completion) => completion.habitId === id,
  )

  await Promise.all([
    ...habitCompletions.map((completion) => completionsStore.delete(completion.id)),
    habitsStore.delete(id),
    tx.done,
  ])
}

export const setCompletionStatus = async ({
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

    const completion: Completion = {
      id,
      habitId,
      status: 'complete',
      day,
      createdAt: now,
      updatedAt: now,
    }

    try {
      await db.add('completions', completion)
    } catch (error) {
      if (isErrorNamed(error, 'ConstraintError')) return
      throw error
    }
  }

  if (status === 'incomplete') {
    const tx = db.transaction('completions', 'readwrite')
    const existing = await tx.store.index('byHabitAndDay').get([habitId, day])

    if (!existing) {
      await tx.done
      return
    }

    await tx.store.delete(existing.id)
    await tx.done
  }
}
