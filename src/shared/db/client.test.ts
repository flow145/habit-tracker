import { afterEach, describe, expect, it, vi } from 'vitest'

import { deleteTestDb } from '~/shared/tests'
import { closeDb, getDb } from './client'

afterEach(async () => {
  vi.useRealTimers()
  await deleteTestDb()
})

describe('database client', () => {
  it('allows closing before the database has been opened', async () => {
    await closeDb()
  })

  it('creates the expected stores and indexes', async () => {
    const db = await getDb()

    expect(db.version).toBe(1)
    expect([...db.objectStoreNames]).toEqual(['completions', 'habits'])

    const tx = db.transaction(['habits', 'completions'])
    const habits = tx.objectStore('habits')
    const completions = tx.objectStore('completions')

    expect(habits.keyPath).toBe('id')
    expect(habits.index('byCreatedAt').keyPath).toBe('createdAt')
    expect(completions.keyPath).toBe('id')
    expect(completions.index('byHabitAndDate').keyPath).toEqual(['habitId', 'date'])
    expect(completions.index('byHabitAndDate').unique).toBe(true)
  })

  it('caches an open connection and can close and reopen it', async () => {
    const first = getDb()
    expect(getDb()).toBe(first)

    const firstDb = await first
    await closeDb()

    const secondDb = await getDb()
    expect(secondDb).not.toBe(firstDb)
  })

  it('preserves data across close and reopen', async () => {
    const db = await getDb()
    const createdAt = new Date('2026-01-01T00:00:00.000Z')
    const updatedAt = new Date('2026-01-02T00:00:00.000Z')
    const record = {
      id: 'habit-persistence',
      name: 'Persistence',
      description: '',
      schedule: { frequency: 1, interval: 1, intervalUnit: 'day' as const },
      createdAt,
      updatedAt,
    }

    await db.put('habits', record)
    await closeDb()

    const reopened = await getDb()
    const stored = await reopened.get('habits', record.id)

    expect(stored).toEqual(record)
    expect(stored?.createdAt).toEqual(createdAt)
    expect(stored?.updatedAt).toEqual(updatedAt)
  })
})
