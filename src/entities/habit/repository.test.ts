import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  EntityConflictError,
  EntityNotFoundError,
  type Entry,
  getDb,
  type Habit,
} from '~/shared/api'
import { date, makeEntry, makeHabit, resetTestDb } from '~/shared/tests'

import { repository } from './repository'

const schedule = { frequency: 1, interval: 1, intervalUnit: 'days' } as const

const seed = async <T extends Habit | Entry>(value: T) => {
  const db = await getDb()
  if ('habitId' in value) await db.put('entries', value)
  else await db.add('habits', value)
  return value
}

const getOneHabit = async (id: string) => (await getDb()).get('habits', id)
const getOneEntry = async (id: string) => (await getDb()).get('entries', id)
const getAllHabits = async () => (await getDb()).getAll('habits')
const getAllEntries = async () => (await getDb()).getAll('entries')

afterEach(async () => {
  await resetTestDb()
})

describe('loadHabitData', () => {
  it('returns all habits in creation order and all entries', async () => {
    const oldest = await seed(makeHabit({ id: 'habit-1', createdAt: date(1) }))
    const newest = await seed(makeHabit({ id: 'habit-2', createdAt: date(2) }))
    const firstEntry = await seed(makeEntry({ id: 'entry-1', habitId: oldest.id }))
    const secondEntry = await seed(makeEntry({ id: 'entry-2', habitId: newest.id, day: date(2) }))

    expect(await repository.loadData()).toEqual({
      habits: [oldest, newest],
      entries: [firstEntry, secondEntry],
    })
  })
})

describe('addHabitRecord', () => {
  it('persists the supplied record unchanged', async () => {
    const value = {
      id: 'habit-1',
      name: '  Read  ',
      description: '  Before bed  ',
      schedule,
      createdAt: date(1),
      updatedAt: date(1),
    }

    expect(await repository.addHabitRecord(value)).toBeUndefined()
    expect(await getOneHabit(value.id)).toEqual(value)
  })

  it('maps duplicate IDs to EntityConflictError', async () => {
    const value = await seed(makeHabit())

    const result = repository.addHabitRecord(value)
    await expect(result).rejects.toThrow(EntityConflictError)
    await expect(result).rejects.toMatchObject({
      message: `Habit ${value.id} conflicts with existing data`,
      cause: expect.objectContaining({ name: 'ConstraintError' }),
    })
  })
})

describe('updateHabitRecord', () => {
  it('replaces an existing record with the supplied value', async () => {
    const existing = await seed(makeHabit())
    const updated = { ...existing, name: 'Exercise', description: 'Daily', updatedAt: date(3) }

    expect(await repository.updateHabitRecord(updated)).toBeUndefined()
    expect(await getOneHabit(updated.id)).toEqual(updated)
  })

  it('rejects an unknown habit', async () => {
    await expect(
      repository.updateHabitRecord({
        id: 'habit-1',
        name: 'Read',
        description: '',
        schedule,
        createdAt: date(1),
        updatedAt: date(1),
      }),
    ).rejects.toThrow(new EntityNotFoundError('Habit', 'habit-1'))
  })

  it('maps a constraint failure to EntityConflictError', async () => {
    const value = await seed(makeHabit())
    const failure = new DOMException('duplicate', 'ConstraintError')
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw failure
    })

    try {
      const result = repository.updateHabitRecord(value)
      await expect(result).rejects.toThrow(EntityConflictError)
      await expect(result).rejects.toMatchObject({
        message: `Habit ${value.id} conflicts with existing data`,
        cause: failure,
      })
    } finally {
      put.mockRestore()
    }
  })
})

describe('addEntryRecord', () => {
  it('persists the supplied entry unchanged', async () => {
    const value = {
      id: 'entry-1',
      habitId: 'habit-1',
      status: 'complete' as const,
      day: date(1),
      createdAt: date(1),
      updatedAt: date(1),
    }

    expect(await repository.addEntryRecord(value)).toBeUndefined()
    expect(await getOneEntry(value.id)).toEqual(value)
  })

  it('maps duplicate IDs to EntityConflictError', async () => {
    const value = await seed(makeEntry())

    const result = repository.addEntryRecord(value)
    await expect(result).rejects.toThrow(EntityConflictError)
    await expect(result).rejects.toMatchObject({
      message: `Entry ${value.id} conflicts with existing data`,
      cause: expect.objectContaining({ name: 'ConstraintError' }),
    })
  })
})

describe('getEntryRecord', () => {
  it('returns the entry matching the supplied Habit and Day', async () => {
    const entry = await seed(makeEntry({ habitId: 'habit-1', day: date(2) }))
    await seed(makeEntry({ id: 'other', habitId: 'habit-1', day: date(3) }))

    expect(await repository.getEntryRecord({ habitId: entry.habitId, day: entry.day })).toEqual(
      entry,
    )
  })

  it('returns null when no Entry matches', async () => {
    expect(await repository.getEntryRecord({ habitId: 'habit-1', day: date(1) })).toBeNull()
  })
})

describe('deleteEntryRecord', () => {
  it('deletes only the entry matching the habit and day', async () => {
    await seed(makeEntry({ id: 'entry-1', day: date(1) }))
    const kept = await seed(makeEntry({ id: 'entry-2', day: date(2) }))
    const otherHabit = await seed(makeEntry({ id: 'entry-3', habitId: 'habit-2', day: date(1) }))

    expect(await repository.deleteEntryRecord({ habitId: 'habit-1', day: date(1) })).toBeUndefined()
    expect(await getAllEntries()).toEqual([kept, otherHabit])
  })

  it('does nothing when the entry is absent', async () => {
    expect(await repository.deleteEntryRecord({ habitId: 'habit-1', day: date(1) })).toBeUndefined()
  })
})

describe('deleteHabitRecord', () => {
  it('deletes the habit and its entries without affecting other records', async () => {
    const deleted = await seed(makeHabit({ id: 'habit-1' }))
    const kept = await seed(makeHabit({ id: 'habit-2' }))
    await seed(makeEntry({ id: 'entry-1', habitId: deleted.id }))
    await seed(makeEntry({ id: 'entry-2', habitId: deleted.id, day: date(2) }))
    const keptEntry = await seed(makeEntry({ id: 'entry-3', habitId: kept.id }))

    expect(await repository.deleteHabitRecord(deleted.id)).toBeUndefined()
    expect(await getAllHabits()).toEqual([kept])
    expect(await getAllEntries()).toEqual([keptEntry])
  })

  it('rejects an unknown habit without changing records', async () => {
    const value = await seed(makeHabit())
    const valueEntry = await seed(makeEntry())

    await expect(repository.deleteHabitRecord('missing')).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect(await getAllHabits()).toEqual([value])
    expect(await getAllEntries()).toEqual([valueEntry])
  })
})
