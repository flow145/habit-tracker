import { v7 as uuidv7 } from 'uuid'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  type Completion,
  EntityConflictError,
  EntityNotFoundError,
  getDb,
  type Schedule,
} from '~/shared/db'
import { resetTestDb } from '~/shared/tests'
import { addHabit, deleteHabit, editHabit, getHabitList, setCompletionStatus } from './service'

vi.mock('uuid', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uuid')>()
  return { ...actual, v7: vi.fn(actual.v7) }
})

const schedule: Schedule = { frequency: 1, interval: 1, intervalUnit: 'day' }

const createHabit = async (name = 'Read', description?: string) => {
  await addHabit({ name, description, schedule })
  const habit = (await getHabitList()).find((item) => item.name === name)
  if (!habit) throw new Error(`Habit ${name} was not created`)
  return habit
}

const seedCompletion = async (completion: Completion) => {
  await (await getDb()).put('completions', completion)
}

const completion = (
  id: string,
  habitId: string,
  date: string,
  createdAt = new Date('2026-01-01'),
): Completion => ({
  id,
  habitId,
  status: 'complete',
  date,
  createdAt,
  updatedAt: createdAt,
})

afterEach(async () => {
  vi.useRealTimers()
  vi.mocked(uuidv7).mockClear()
  await resetTestDb()
})

describe('addHabit', () => {
  it('creates a habit with defaults and matching timestamps', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
    vi.setSystemTime(createdAt)

    expect(await addHabit({ name: 'Read', schedule })).toBeUndefined()

    expect(await getHabitList()).toEqual([
      {
        id: expect.any(String),
        name: 'Read',
        description: '',
        schedule,
        createdAt,
        updatedAt: createdAt,
        completions: [],
      },
    ])
  })

  it('preserves an explicitly empty description', async () => {
    await addHabit({ name: 'Read', description: '', schedule })

    expect((await getHabitList())[0]?.description).toBe('')
  })

  it('maps a database constraint failure to EntityConflictError', async () => {
    const id = 'habit-conflict'
    const generateId = (() => id) as typeof uuidv7
    vi.mocked(uuidv7).mockImplementationOnce(generateId).mockImplementationOnce(generateId)

    await addHabit({ name: 'Existing', schedule })

    const result = addHabit({ name: 'Read', schedule })
    await expect(result).rejects.toThrow(EntityConflictError)
    await expect(result).rejects.toMatchObject({
      message: `Habit with id:${id} already exists`,
      cause: expect.objectContaining({ name: 'ConstraintError' }),
    })
  })
})

describe('getHabitList', () => {
  it('returns an empty array when there are no habits', async () => {
    expect(await getHabitList()).toEqual([])
  })

  it('returns habits oldest first with empty completion arrays', async () => {
    const oldestAt = new Date('2026-01-01T00:00:00.000Z')
    const newestAt = new Date('2026-01-03T00:00:00.000Z')
    vi.setSystemTime(oldestAt)
    await addHabit({ name: 'Oldest', schedule })
    vi.setSystemTime(newestAt)
    await addHabit({ name: 'Newest', schedule })

    expect(await getHabitList()).toEqual([
      expect.objectContaining({ name: 'Oldest', createdAt: oldestAt, completions: [] }),
      expect.objectContaining({ name: 'Newest', createdAt: newestAt, completions: [] }),
    ])
  })

  it('joins only matching completions and omits habitId from exposed records', async () => {
    const first = await createHabit('First')
    const second = await createHabit('Second')
    const firstCompletion = completion('first-completion', first.id, '2026-01-01')
    const secondCompletion = completion('second-completion', second.id, '2026-01-02')
    const unrelatedCompletion = completion('unrelated-completion', 'missing', '2026-01-03')
    await seedCompletion(firstCompletion)
    await seedCompletion(secondCompletion)
    await seedCompletion(unrelatedCompletion)

    expect(await getHabitList()).toEqual([
      expect.objectContaining({
        id: first.id,
        completions: [
          {
            id: firstCompletion.id,
            status: 'complete',
            date: firstCompletion.date,
            createdAt: firstCompletion.createdAt,
            updatedAt: firstCompletion.updatedAt,
          },
        ],
      }),
      expect.objectContaining({
        id: second.id,
        completions: [
          {
            id: secondCompletion.id,
            status: 'complete',
            date: secondCompletion.date,
            createdAt: secondCompletion.createdAt,
            updatedAt: secondCompletion.updatedAt,
          },
        ],
      }),
    ])
  })
})

describe('editHabit', () => {
  it('updates only supplied fields, including an empty description', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const updatedAt = new Date('2026-01-03T00:00:00.000Z')
    vi.setSystemTime(createdAt)
    const habit = await createHabit('Read', 'Before')
    vi.setSystemTime(updatedAt)

    expect(await editHabit({ id: habit.id, description: '' })).toBeUndefined()

    expect((await getHabitList())[0]).toEqual({
      ...habit,
      description: '',
      createdAt,
      updatedAt,
      completions: [],
    })
  })

  it('updates all editable fields', async () => {
    const updatedSchedule: Schedule = { frequency: 3, interval: 1, intervalUnit: 'week' }
    const habit = await createHabit()
    const updatedAt = new Date('2026-01-03T00:00:00.000Z')
    vi.setSystemTime(updatedAt)

    await editHabit({
      id: habit.id,
      name: 'Exercise',
      description: 'Daily',
      schedule: updatedSchedule,
    })

    expect((await getHabitList())[0]).toEqual({
      ...habit,
      name: 'Exercise',
      description: 'Daily',
      schedule: updatedSchedule,
      updatedAt,
      completions: [],
    })
  })

  it('rejects an unknown habit without changing the database', async () => {
    const habit = await createHabit()

    await expect(editHabit({ id: 'missing', name: 'Nope' })).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect((await getHabitList())[0]).toEqual(expect.objectContaining(habit))
  })

  it('maps an injected put constraint failure to EntityConflictError', async () => {
    const habit = await createHabit()
    const failure = new DOMException('duplicate', 'ConstraintError')
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw failure
    })

    try {
      await addHabit(habit)
      const result = editHabit({ id: habit.id, name: 'Changed' })
      await expect(result).rejects.toThrow(EntityConflictError)
      await expect(result).rejects.toMatchObject({
        message: `Habit with id:${habit.id} already exists`,
        cause: failure,
      })
    } finally {
      put.mockRestore()
    }
  })
})

describe('deleteHabit', () => {
  it('deletes the habit and all completions without affecting another habit', async () => {
    const deleted = await createHabit('Delete')
    const kept = await createHabit('Keep')
    const deletedCompletions = [
      completion('before-1970', deleted.id, '0001-01-01'),
      completion('after-3000', deleted.id, '9999-12-31'),
    ]
    const keptCompletion = completion('kept-completion', kept.id, '2026-01-01')
    for (const record of [...deletedCompletions, keptCompletion]) await seedCompletion(record)

    expect(await deleteHabit(deleted.id)).toBeUndefined()

    expect(await getHabitList()).toEqual([
      expect.objectContaining({
        id: kept.id,
        completions: [expect.objectContaining({ id: keptCompletion.id })],
      }),
    ])
    expect(await (await getDb()).get('habits', deleted.id)).toBeUndefined()
  })

  it('rejects an unknown habit without affecting existing records', async () => {
    const habit = await createHabit()
    const record = completion('completion', habit.id, '2026-01-01')
    await seedCompletion(record)

    await expect(deleteHabit('missing')).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect(await getHabitList()).toEqual([
      expect.objectContaining({
        id: habit.id,
        completions: [expect.objectContaining({ id: record.id })],
      }),
    ])
  })
})

describe('setCompletionStatus', () => {
  it('creates a complete completion with generated fields', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
    vi.setSystemTime(createdAt)

    expect(
      await setCompletionStatus({ habitId: 'habit-1', date: '2026-01-01', status: 'complete' }),
    ).toBeUndefined()

    expect(await (await getDb()).getAll('completions')).toEqual([
      {
        id: expect.any(String),
        habitId: 'habit-1',
        status: 'complete',
        date: '2026-01-01',
        createdAt,
        updatedAt: createdAt,
      },
    ])
  })

  it('is idempotent for a duplicate completion and preserves the original record', async () => {
    const existing = completion('existing', 'habit-1', '2026-01-01')
    await seedCompletion(existing)

    expect(
      await setCompletionStatus({ habitId: 'habit-1', date: '2026-01-01', status: 'complete' }),
    ).toBeUndefined()
    expect(await (await getDb()).getAll('completions')).toEqual([existing])
  })

  it('removes an existing completion for incomplete', async () => {
    const existing = completion('existing', 'habit-1', '2026-01-01')
    await seedCompletion(existing)

    expect(
      await setCompletionStatus({ habitId: 'habit-1', date: '2026-01-01', status: 'incomplete' }),
    ).toBeUndefined()
    expect(await (await getDb()).getAll('completions')).toEqual([])
  })

  it('treats incomplete for a missing date as a no-op', async () => {
    expect(
      await setCompletionStatus({ habitId: 'missing', date: '2026-01-01', status: 'incomplete' }),
    ).toBeUndefined()
  })

  it('isolates completion changes by habit and date', async () => {
    const records = [
      completion('same-habit-other-date', 'habit-1', '2026-01-02'),
      completion('other-habit', 'habit-2', '2026-01-01'),
      completion('target', 'habit-1', '2026-01-01'),
    ]
    for (const record of records) await seedCompletion(record)

    await setCompletionStatus({ habitId: 'habit-1', date: '2026-01-01', status: 'incomplete' })

    expect(await (await getDb()).getAll('completions')).toEqual(
      expect.arrayContaining([records[0], records[1]]),
    )
  })
})
