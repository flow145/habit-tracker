import { afterEach, describe, expect, it, vi } from 'vitest'

import { resetTestDb } from '~/shared/tests'
import { getDb } from './client'
import { RecordAlreadyExistsError, RecordNotFoundError, RepositoryError } from './errors'
import { repositories } from './repositories'
import type { Completion, Schedule } from './schema'

const schedule: Schedule = { frequency: 1, interval: 1, intervalUnit: 'day' }

const createHabit = (name = 'Read') => repositories.habits.create({ name, schedule })

const seedCompletion = async (completion: Completion) => {
  await (await getDb()).put('completions', completion)
}

afterEach(async () => {
  vi.useRealTimers()
  await resetTestDb()
})

describe('habit repository', () => {
  it('creates and reads a complete habit', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
    vi.setSystemTime(createdAt)

    const habit = await createHabit()

    expect(habit).toEqual({
      id: expect.any(String),
      name: 'Read',
      description: '',
      schedule,
      createdAt,
      updatedAt: createdAt,
    })
    expect(await repositories.habits.findById(habit.id)).toEqual(habit)
    expect(await repositories.habits.findById('missing')).toBeNull()
  })

  it('preserves an explicitly empty description', async () => {
    const habit = await repositories.habits.create({ name: 'Read', description: '', schedule })

    expect(habit.description).toBe('')
  })

  it('returns habits oldest first', async () => {
    const oldestAt = new Date('2026-01-01T00:00:00.000Z')
    const newestAt = new Date('2026-01-03T00:00:00.000Z')
    vi.setSystemTime(oldestAt)
    const oldest = await createHabit('Oldest')
    vi.setSystemTime(newestAt)
    const newest = await createHabit('Newest')

    expect(await repositories.habits.findAll()).toEqual([oldest, newest])
  })

  it('updates only supplied fields and returns the updated habit', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(createdAt)
    const habit = await repositories.habits.create({
      name: 'Read',
      description: 'Before',
      schedule,
    })
    const updatedAt = new Date('2026-01-03T00:00:00.000Z')
    vi.setSystemTime(updatedAt)

    const updated = await repositories.habits.update({ id: habit.id, description: '' })

    expect(updated).toEqual({ ...habit, description: '', updatedAt })
    expect(await repositories.habits.findById(habit.id)).toEqual(updated)
  })

  it('supports full habit updates and rejects missing updates', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const updatedAt = new Date('2026-01-02T00:00:00.000Z')
    const updatedSchedule: Schedule = { frequency: 3, interval: 1, intervalUnit: 'week' }
    vi.setSystemTime(createdAt)
    const habit = await createHabit()
    vi.setSystemTime(updatedAt)
    const updated = await repositories.habits.update({
      id: habit.id,
      name: 'Exercise',
      description: 'Daily',
      schedule: updatedSchedule,
    })

    expect(updated).toEqual({
      ...habit,
      name: 'Exercise',
      description: 'Daily',
      schedule: updatedSchedule,
      updatedAt,
    })
    await expect(repositories.habits.update({ id: 'missing', name: 'Nope' })).rejects.toThrow(
      new RecordNotFoundError('Habit', 'missing'),
    )
    expect(await repositories.habits.findById('missing')).toBeNull()
  })

  it('permanently deletes only the habit and returns its snapshot', async () => {
    const habit = await createHabit()
    const completion = await repositories.completions.create({
      habitId: habit.id,
      date: '2026-01-01',
    })

    expect(await repositories.habits.delete(habit.id)).toEqual(habit)
    expect(await repositories.habits.findById(habit.id)).toBeNull()
    expect(await repositories.habits.findAll()).toEqual([])
    expect(await repositories.completions.findByHabit(habit.id)).toEqual([completion])
    await expect(repositories.habits.delete('missing')).rejects.toThrow(
      new RecordNotFoundError('Habit', 'missing'),
    )
  })
})

describe('completion repository', () => {
  it('creates completions with complete stored fields', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
    vi.setSystemTime(createdAt)

    const completion = await repositories.completions.create({
      habitId: 'habit-1',
      date: '2026-01-01',
    })

    expect(completion).toEqual({
      id: expect.any(String),
      habitId: 'habit-1',
      status: 'complete',
      date: '2026-01-01',
      createdAt,
      updatedAt: createdAt,
    })
  })

  it('enforces uniqueness by habit and date, but allows other dates and habits', async () => {
    const first = await repositories.completions.create({ habitId: 'habit-1', date: '2026-01-01' })
    const duplicate = repositories.completions.create({ habitId: 'habit-1', date: '2026-01-01' })
    await expect(duplicate).rejects.toThrow(RecordAlreadyExistsError)
    const duplicateError = await duplicate.catch((error: unknown) => error)

    expect(duplicateError).toBeInstanceOf(RecordAlreadyExistsError)
    expect(duplicateError).toBeInstanceOf(RepositoryError)
    expect(duplicateError).toMatchObject({
      name: 'RecordAlreadyExistsError',
      message: expect.stringMatching(/^Completion with id [0-9a-f-]{36} already exists$/),
      cause: expect.objectContaining({ name: 'ConstraintError' }),
    })
    const otherDate = await repositories.completions.create({
      habitId: 'habit-1',
      date: '2026-01-02',
    })
    const otherHabit = await repositories.completions.create({
      habitId: 'habit-2',
      date: '2026-01-01',
    })

    expect(first.date).toBe('2026-01-01')
    expect(otherDate.date).toBe('2026-01-02')
    expect(otherHabit.habitId).toBe('habit-2')
  })

  it('lists all completions for one habit oldest first, including future dates', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const pastCompletion: Completion = {
      id: 'past',
      habitId: 'habit-1',
      status: 'complete',
      date: '2026-01-01',
      createdAt,
      updatedAt: createdAt,
    }
    const futureCompletion: Completion = {
      id: 'future',
      habitId: 'habit-1',
      status: 'complete',
      date: '2099-12-31',
      createdAt,
      updatedAt: createdAt,
    }
    const otherHabitCompletion: Completion = {
      id: 'other-habit',
      habitId: 'habit-2',
      status: 'complete',
      date: '2099-12-31',
      createdAt,
      updatedAt: createdAt,
    }
    await seedCompletion(pastCompletion)
    await seedCompletion(futureCompletion)
    await seedCompletion(otherHabitCompletion)

    expect(await repositories.completions.findByHabit('habit-1')).toEqual([
      pastCompletion,
      futureCompletion,
    ])
    expect(await repositories.completions.findByHabit('missing')).toEqual([])
  })

  it('deletes and returns a completion, rejecting missing IDs', async () => {
    const completion = await repositories.completions.create({
      habitId: 'habit-1',
      date: '2026-01-01',
    })
    const unrelated = await repositories.completions.create({
      habitId: 'habit-2',
      date: '2026-01-01',
    })

    expect(await repositories.completions.delete(completion.id)).toEqual(completion)
    expect(await repositories.completions.findByHabit('habit-1')).toEqual([])
    expect(await repositories.completions.findByHabit('habit-2')).toEqual([unrelated])
    await expect(repositories.completions.delete('missing')).rejects.toThrow(
      new RecordNotFoundError('Completion', 'missing'),
    )
  })

  it('keeps completion records after reopening the database', async () => {
    const completion = await repositories.completions.create({
      habitId: 'habit-1',
      date: '2026-01-01',
    })
    const { closeDb } = await import('./client')
    await closeDb()

    expect(await repositories.completions.findByHabit('habit-1')).toEqual([completion])
  })
})

describe('repository errors', () => {
  it('preserves non-constraint create failures', async () => {
    const failure = new Error('database unavailable')
    const db = await getDb()
    const add = vi.spyOn(db, 'add').mockRejectedValueOnce(failure).mockRejectedValueOnce(failure)

    await expect(createHabit()).rejects.toThrow(failure)
    await expect(
      repositories.completions.create({ habitId: 'habit-1', date: '2026-01-01' }),
    ).rejects.toThrow(failure)
    add.mockRestore()
  })
})
