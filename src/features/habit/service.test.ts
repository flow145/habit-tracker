import { v7 as uuidv7 } from 'uuid'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EntityConflictError,
  EntityNotFoundError,
  getDb,
  type Schedule,
  type Status,
} from '~/shared/db'
import { resetTestDb } from '~/shared/tests'
import { addHabit, deleteHabit, editHabit, getHabitList, setStatus } from './service'

const schedule: Schedule = { frequency: 1, interval: 1, intervalUnit: 'days' }

const seedHabit = async (data?: {
  id?: string
  name?: string
  description?: string
  schedule?: Schedule
  createdAt?: string
  updatedAt?: string
}) => {
  const habit = {
    id: data?.id ?? '1',
    name: data?.name ?? 'Read',
    description: data?.description ?? '',
    schedule: data?.schedule ?? schedule,
    createdAt: new Date(data?.createdAt ?? '2026-01-01T00:00:00'),
    updatedAt: new Date(data?.updatedAt ?? '2026-01-01T00:00:00'),
  }
  ;(await getDb()).add('habits', habit)
  return habit
}

const seedEntry = async (data: {
  id?: string
  habitId?: string
  status?: Status
  day?: string
  createdAt?: string
  updatedAt?: string
}) => {
  const entry = {
    id: data?.id ?? '1',
    habitId: data?.habitId ?? '1',
    status: data?.status ?? 'complete',
    day: new Date(data?.day ?? '2026-01-01T00:00:00'),
    createdAt: new Date(data?.createdAt ?? '2026-01-01T00:00:00'),
    updatedAt: new Date(data?.updatedAt ?? '2026-01-01T00:00:00'),
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
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
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
    expect(await getHabitList()).toEqual([])
  })

  it.todo('returns habits oldest first with empty entry arrays', async () => {
    const first = await seedHabit({ id: '1', name: 'Oldest', createdAt: '2026-01-01T00:00:00' })
    const second = await seedHabit({ id: '2', name: 'Newest', createdAt: '2026-01-03T00:00:00' })

    expect(await getHabitList()).toEqual([
      { ...first, entries: [] },
      { ...second, entries: [] },
    ])
  })

  it.todo('joins only matching entries and omits habitId from exposed records', async () => {
    const firstHabit = await seedHabit({ id: '1', name: 'First' })
    const secondHabit = await seedHabit({ id: '2', name: 'Second' })
    const { habitId: _, ...firstEntry } = await seedEntry({
      id: '1',
      habitId: firstHabit.id,
      day: '2026-01-01T00:00:00',
    })
    const { habitId: __, ...secondEntry } = await seedEntry({
      id: '2',
      habitId: secondHabit.id,
      day: '2026-01-02T00:00:00',
    })
    await seedEntry({
      id: '3',
      habitId: 'missing',
      day: '2026-01-03T00:00:00',
    })

    expect(await getHabitList()).toEqual([
      expect.objectContaining({
        id: firstHabit.id,
        entries: [firstEntry],
      }),
      expect.objectContaining({
        id: secondHabit.id,
        entries: [secondEntry],
      }),
    ])
  })
})

describe('editHabit', () => {
  it('updates only supplied fields, including an empty description', async () => {
    const habit = await seedHabit({
      name: 'Read',
      description: 'Before',
      createdAt: '2026-01-01T00:00:00',
    })
    const updatedAt = new Date('2026-01-03T00:00:00')
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
    const updatedAt = new Date('2026-01-03T00:00:00')
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
    await seedEntry({ id: '1', habitId: deleted.id, day: '0001-01-01T00:00:00' })
    await seedEntry({ id: '2', habitId: deleted.id, day: '9999-12-31T00:00:00' })
    const keptEntry = await seedEntry({
      id: '3',
      habitId: kept.id,
      day: '2026-01-01T00:00:00',
    })

    expect(await deleteHabit(deleted.id)).toBeUndefined()
    expect(await getAllHabits()).toEqual([kept])
    expect(await getAllEntries()).toEqual([keptEntry])
    expect(await getHabit(deleted.id)).toBeUndefined()
  })

  it('rejects an unknown habit without affecting existing records', async () => {
    const habit = await seedHabit()
    const entry = await seedEntry({ habitId: habit.id, day: '2026-01-01T00:00:00' })

    await expect(deleteHabit('missing')).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect(await getAllHabits()).toEqual([habit])
    expect(await getAllEntries()).toEqual([entry])
  })
})

describe('setEntryStatus', () => {
  it('creates a complete entry with generated fields', async () => {
    const createdAt = new Date('2026-01-01T10:00:00.000Z')
    const day = new Date('2026-01-01T00:00:00')
    vi.setSystemTime(createdAt)

    expect(await setStatus({ habitId: '1', day, status: 'complete' })).toBeUndefined()
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

  it('is idempotent for a duplicate entry and preserves the original record', async () => {
    const existing = await seedEntry({ habitId: '1', day: '2026-01-01T00:00:00' })

    expect(
      await setStatus({
        habitId: '1',
        day: new Date('2026-01-01T00:00:00'),
        status: 'complete',
      }),
    ).toBeUndefined()
    expect(await getAllEntries()).toEqual([existing])
  })

  it('removes an existing entry for incomplete status', async () => {
    await seedEntry({ habitId: '1', day: '2026-01-01T00:00:00' })

    expect(
      await setStatus({
        habitId: '1',
        day: new Date('2026-01-01T00:00:00'),
        status: 'incomplete',
      }),
    ).toBeUndefined()
    expect(await getAllEntries()).toEqual([])
  })

  it('treats incomplete for a missing date as a no-op', async () => {
    expect(
      await setStatus({
        habitId: 'missing',
        day: new Date('2026-01-01T00:00:00'),
        status: 'incomplete',
      }),
    ).toBeUndefined()
  })

  it('isolates status changes by habit and date', async () => {
    const first = await seedEntry({
      id: '1',
      habitId: '1',
      day: '2026-01-02T00:00:00',
    })
    const second = await seedEntry({
      id: '2',
      habitId: '2',
      day: '2026-01-01T00:00:00',
    })
    await seedEntry({ id: '3', habitId: '1', day: '2026-01-01T00:00:00' })

    await setStatus({
      habitId: '1',
      day: new Date('2026-01-01T00:00:00'),
      status: 'incomplete',
    })

    expect(await getAllEntries()).toEqual([first, second])
  })
})
