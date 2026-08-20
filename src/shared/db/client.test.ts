import { afterEach, describe, expect, it, vi } from 'vitest'

import { resetTestDb } from '~/shared/tests'
import { closeDb, getDb } from './client'

afterEach(async () => {
  vi.useRealTimers()
  await resetTestDb()
})

describe('database client', () => {
  it('allows closing before the database has been opened', async () => {
    await closeDb()
  })

  it('creates the expected stores and indexes', async () => {
    const db = await getDb()

    expect(db.version).toBe(1)
    expect([...db.objectStoreNames]).toEqual(['entries', 'habits'])

    const tx = db.transaction(['habits', 'entries'])
    const habits = tx.objectStore('habits')
    const entries = tx.objectStore('entries')

    expect(habits.keyPath).toBe('id')
    expect(habits.index('byCreatedAt').keyPath).toBe('createdAt')
    expect(entries.keyPath).toBe('id')
    expect(entries.index('byHabitAndDay').keyPath).toEqual(['habitId', 'day'])
    expect(entries.index('byHabitAndDay').unique).toBe(true)
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
    const createdAt = new Date('2026-01-01T00:00:00')
    const updatedAt = new Date('2026-01-02T00:00:00')
    const record = {
      id: 'habit-persistence',
      name: 'Persistence',
      description: '',
      schedule: { frequency: 1, interval: 1, intervalUnit: 'days' as const },
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
