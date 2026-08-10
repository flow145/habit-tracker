import { v7 as uuidv7 } from 'uuid'
import {
  type Completion,
  EntityConflictError,
  EntityNotFoundError,
  getDb,
  type Habit,
  type ISODate,
  type Schedule,
} from '~/shared/db'
import { isErrorNamed, toISODate } from '~/shared/lib'

export const addHabit = async ({
  name,
  description,
  schedule,
}: {
  name: string
  description?: string
  schedule: Schedule
}) => {
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
}

export const getHabitList = async () => {
  const db = await getDb()
  const tx = db.transaction(['habits', 'completions'], 'readonly')

  const habits = await tx.objectStore('habits').getAll()
  const completions = await tx.objectStore('completions').getAll()
  const habitsWithCompletions = habits.map((habit) => ({
    ...habit,
    completions: completions
      .filter((completion) => completion.habitId === habit.id)
      .map(({ habitId, ...completion }) => completion),
  }))

  await tx.done
  return habitsWithCompletions
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
}) => {
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
}

export const deleteHabit = async (id: string) => {
  const db = await getDb()
  const tx = db.transaction(['habits', 'completions'], 'readwrite')
  const existing = await tx.objectStore('habits').get(id)

  if (!existing) {
    await tx.done
    throw new EntityNotFoundError('Habit', id)
  }

  const completions = await tx
    .objectStore('completions')
    .index('byHabitAndDate')
    .getAll(
      IDBKeyRange.bound([id, toISODate(new Date(0))], [id, toISODate(new Date('3000-12-31'))]),
    )
  const completionDeleteOps = completions.map((completion) =>
    tx.objectStore('completions').delete(completion.id),
  )

  await Promise.all([...completionDeleteOps, tx.objectStore('habits').delete(id), tx.done])
}

export const setCompletionStatus = async ({
  habitId,
  date,
  status,
}: {
  habitId: string
  date: ISODate
  status: 'complete' | 'incomplete'
}) => {
  const db = await getDb()

  if (status === 'complete') {
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
      await db.add('completions', completion)
    } catch (error) {
      if (isErrorNamed(error, 'ConstraintError')) return
      throw error
    }
  }

  if (status === 'incomplete') {
    const tx = db.transaction('completions', 'readwrite')
    const existing = await tx.store.index('byHabitAndDate').get([habitId, date])

    if (!existing) {
      await tx.done
      return
    }

    await tx.store.delete(existing.id)
    await tx.done
  }
}
