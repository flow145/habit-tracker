import { v7 as uuidv7 } from 'uuid'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EntityConflictError,
  EntityNotFoundError,
  type ExplicitStatus,
  getDb,
  type Schedule,
} from '~/shared/db'
import { date, resetTestDb } from '~/shared/tests'
import { addHabit, deleteHabit, editHabit, getHabitList, getNextStatus, toggleDay } from './service'

const schedule: Schedule = { frequency: 1, interval: 1, intervalUnit: 'days' }

const seedHabit = async (data?: {
  id?: string
  name?: string
  description?: string
  schedule?: Schedule
  createdAt?: Date
  updatedAt?: Date
}) => {
  const habit = {
    id: data?.id ?? '1',
    name: data?.name ?? 'Read',
    description: data?.description ?? '',
    schedule: data?.schedule ?? schedule,
    createdAt: data?.createdAt ?? date(1),
    updatedAt: data?.updatedAt ?? date(1),
  }
  ;(await getDb()).add('habits', habit)
  return habit
}

const seedEntry = async (data: {
  id?: string
  habitId?: string
  status?: ExplicitStatus
  day?: Date
  createdAt?: Date
  updatedAt?: Date
}) => {
  const entry = {
    id: data?.id ?? '1',
    habitId: data?.habitId ?? '1',
    status: data?.status ?? 'complete',
    day: data?.day ?? date(1),
    createdAt: data?.createdAt ?? date(1),
    updatedAt: data?.updatedAt ?? date(1),
  }
  ;(await getDb()).put('entries', entry)
  return entry
}

const getHabit = async (id: string) => (await getDb()).get('habits', id)
const getAllHabits = async () => (await getDb()).getAll('habits')
const getAllEntries = async () => (await getDb()).getAll('entries')

vi.mock('uuid', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uuid')>()
  return { ...actual, v7: vi.fn(actual.v7) }
})

afterEach(async () => {
  vi.useRealTimers()
  await resetTestDb()
})

describe('addHabit', () => {
  it('creates a habit with defaults and matching timestamps', async () => {
    const createdAt = date(1, 1, 10)
    vi.setSystemTime(createdAt)

    const expected = {
      id: expect.any(String),
      name: 'Read',
      description: '',
      schedule,
      createdAt,
      updatedAt: createdAt,
    }

    expect(await addHabit({ name: 'Read', schedule })).toEqual(expected)
    expect(await getAllHabits()).toEqual([expected])
  })

  it('preserves an explicitly empty description', async () => {
    const { id } = await addHabit({ name: 'Read', description: '', schedule })

    expect((await getHabit(id))?.description).toBe('')
  })

  it('maps a database constraint failure to EntityConflictError', async () => {
    const id = 'conflict'
    const generateId = (() => id) as typeof uuidv7
    vi.mocked(uuidv7).mockImplementationOnce(generateId).mockImplementationOnce(generateId)

    await addHabit({ name: 'Existing', schedule })

    const result = addHabit({ name: 'Read', schedule })
    await expect(result).rejects.toThrow(EntityConflictError)
    await expect(result).rejects.toMatchObject({
      message: `Habit with id:${id} already exists`,
      cause: expect.objectContaining({ name: 'ConstraintError' }),
    })

    vi.mocked(uuidv7).mockClear()
  })
})

describe('getHabitList', () => {
  it('returns an empty array when there are no habits', async () => {
    expect(await getHabitList({ start: date(1), end: date(3) })).toEqual([])
  })

  it('returns habits oldest first with entries for the requested range', async () => {
    const first = await seedHabit({ id: '1', name: 'Oldest', createdAt: date(1) })
    const second = await seedHabit({ id: '2', name: 'Newest', createdAt: date(3) })

    expect(await getHabitList({ start: date(1), end: date(3) })).toEqual([
      {
        ...first,
        computedEntries: [
          { day: date(1), status: 'incomplete' },
          { day: date(2), status: 'incomplete' },
          { day: date(3), status: 'incomplete' },
        ],
      },
      {
        ...second,
        computedEntries: [
          { day: date(1), status: 'incomplete' },
          { day: date(2), status: 'incomplete' },
          { day: date(3), status: 'incomplete' },
        ],
      },
    ])
  })

  it('joins only matching entries and omits habitId from exposed records', async () => {
    const firstHabit = await seedHabit({ id: '1', name: 'First' })
    const secondHabit = await seedHabit({ id: '2', name: 'Second' })
    const firstEntry = await seedEntry({
      id: '1',
      habitId: firstHabit.id,
      day: date(1),
    })
    const secondEntry = await seedEntry({
      id: '2',
      habitId: secondHabit.id,
      day: date(2),
    })
    await seedEntry({
      id: '3',
      habitId: 'missing',
      day: date(3),
    })

    expect(await getHabitList({ start: date(1), end: date(3) })).toEqual([
      expect.objectContaining({
        id: firstHabit.id,
        computedEntries: [
          { day: firstEntry.day, status: 'complete' },
          { day: date(2), status: 'incomplete' },
          { day: date(3), status: 'incomplete' },
        ],
      }),
      expect.objectContaining({
        id: secondHabit.id,
        computedEntries: [
          { day: date(1), status: 'incomplete' },
          { day: secondEntry.day, status: 'complete' },
          { day: date(3), status: 'incomplete' },
        ],
      }),
    ])
  })
})

describe('editHabit', () => {
  it('updates only supplied fields, including an empty description', async () => {
    const habit = await seedHabit({
      name: 'Read',
      description: 'Before',
      createdAt: date(1),
    })
    const updatedAt = date(3)
    vi.setSystemTime(updatedAt)

    expect(await editHabit({ id: habit.id, description: '' })).toEqual({
      ...habit,
      description: '',
      updatedAt,
    })
  })

  it('updates all editable fields', async () => {
    const updatedSchedule: Schedule = { frequency: 3, interval: 1, intervalUnit: 'weeks' }
    const habit = await seedHabit()
    const updatedAt = date(3)
    vi.setSystemTime(updatedAt)

    expect(
      await editHabit({
        id: habit.id,
        name: 'Exercise',
        description: 'Daily',
        schedule: updatedSchedule,
      }),
    ).toEqual({
      ...habit,
      name: 'Exercise',
      description: 'Daily',
      schedule: updatedSchedule,
      updatedAt,
    })
  })

  it('rejects an unknown habit without changing the database', async () => {
    const habit = await seedHabit()

    await expect(editHabit({ id: 'missing', name: 'Missing' })).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect(await getHabit(habit.id)).toEqual(habit)
  })

  it('maps an injected put constraint failure to EntityConflictError', async () => {
    const habit = await seedHabit()
    const failure = new DOMException('duplicate', 'ConstraintError')
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw failure
    })

    try {
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
  it('deletes the habit and all entries without affecting another habit', async () => {
    const deleted = await seedHabit({ id: '1', name: 'Delete' })
    const kept = await seedHabit({ id: '2', name: 'Keep' })
    await seedEntry({ id: '1', habitId: deleted.id, day: new Date('0001-01-01T00:00:00') })
    await seedEntry({ id: '2', habitId: deleted.id, day: new Date('9999-12-31T00:00:00') })
    const keptEntry = await seedEntry({
      id: '3',
      habitId: kept.id,
      day: date(1),
    })

    expect(await deleteHabit(deleted.id)).toBeUndefined()
    expect(await getAllHabits()).toEqual([kept])
    expect(await getAllEntries()).toEqual([keptEntry])
    expect(await getHabit(deleted.id)).toBeUndefined()
  })

  it('rejects an unknown habit without affecting existing records', async () => {
    const habit = await seedHabit()
    const entry = await seedEntry({ habitId: habit.id, day: date(1) })

    await expect(deleteHabit('missing')).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect(await getAllHabits()).toEqual([habit])
    expect(await getAllEntries()).toEqual([entry])
  })
})

describe('getNextStatus', () => {
  it('cycles complete to incomplete', () => {
    expect(getNextStatus('complete')).toBe('incomplete')
  })

  it('cycles every other status to complete', () => {
    expect(getNextStatus('incomplete')).toBe('complete')
    expect(getNextStatus('not-required')).toBe('complete')
  })
})

describe('toggleDay', () => {
  it('creates a complete entry with generated fields', async () => {
    const createdAt = date(1, 1, 10)
    const day = date(1)
    vi.setSystemTime(createdAt)

    expect(await toggleDay({ habitId: '1', day, currentStatus: 'incomplete' })).toBeUndefined()
    expect(await getAllEntries()).toEqual([
      {
        id: expect.any(String),
        habitId: '1',
        status: 'complete',
        day,
        createdAt,
        updatedAt: createdAt,
      },
    ])
  })

  it('marks a not-required day complete', async () => {
    const day = date(1)

    expect(await toggleDay({ habitId: '1', day, currentStatus: 'not-required' })).toBeUndefined()
    expect(await getAllEntries()).toEqual([
      expect.objectContaining({ habitId: '1', status: 'complete', day }),
    ])
  })

  it('is idempotent for a duplicate entry and preserves the original record', async () => {
    const existing = await seedEntry({ habitId: '1', day: date(1) })

    expect(
      await toggleDay({
        habitId: '1',
        day: date(1),
        currentStatus: 'incomplete',
      }),
    ).toBeUndefined()
    expect(await getAllEntries()).toEqual([existing])
  })

  it('removes an existing entry when toggled from complete', async () => {
    await seedEntry({ habitId: '1', day: date(1) })

    expect(
      await toggleDay({
        habitId: '1',
        day: date(1),
        currentStatus: 'complete',
      }),
    ).toBeUndefined()
    expect(await getAllEntries()).toEqual([])
  })

  it('treats toggling from complete for a missing date as a no-op', async () => {
    expect(
      await toggleDay({
        habitId: 'missing',
        day: date(1),
        currentStatus: 'complete',
      }),
    ).toBeUndefined()
  })

  it('isolates status changes by habit and date', async () => {
    const first = await seedEntry({
      id: '1',
      habitId: '1',
      day: date(2),
    })
    const second = await seedEntry({
      id: '2',
      habitId: '2',
      day: date(1),
    })
    await seedEntry({ id: '3', habitId: '1', day: date(1) })

    await toggleDay({
      habitId: '1',
      day: date(1),
      currentStatus: 'complete',
    })

    expect(await getAllEntries()).toEqual([first, second])
  })
})
