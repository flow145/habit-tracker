import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EntityNotFoundError, type Entry, type Habit, type Schedule } from '~/shared/db'
import { date, entry, habit } from '~/shared/tests'
import type { HabitData } from './service'

vi.mock('uuid', () => ({ v7: vi.fn(() => 'generated-id') }))
vi.mock('./service', () => ({
  loadHabitData: vi.fn(),
  addHabitRecord: vi.fn(),
  updateHabitRecord: vi.fn(),
  addEntryRecord: vi.fn(),
  deleteEntryRecord: vi.fn(),
  deleteHabitRecord: vi.fn(),
}))

const schedule: Schedule = { frequency: 1, interval: 1, intervalUnit: 'days' }

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

let actions: typeof import('./actions')
let service: typeof import('./service')
let useHabitStore: typeof import('./store')['useHabitStore']

const setReadyStore = (habits: Habit[] = [], entries: Entry[] = []) => {
  useHabitStore.setState({
    hydrationStatus: 'ready',
    hydrationError: null,
    habitIds: habits.map(({ id }) => id),
    habitsById: Object.fromEntries(habits.map((value) => [value.id, value])),
    entriesByHabitId: entries.reduce<Record<string, Record<string, Entry>>>((acc, value) => {
      acc[value.habitId] = { ...acc[value.habitId], [value.day.toISOString()]: value }
      return acc
    }, {}),
  })
}

const waitForActions = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

beforeEach(async () => {
  vi.resetModules()
  service = await import('./service')
  actions = await import('./actions')
  useHabitStore = (await import('./store')).useHabitStore
  vi.mocked(service.loadHabitData).mockResolvedValue({ habits: [], entries: [] })
  vi.mocked(service.addHabitRecord).mockResolvedValue()
  vi.mocked(service.updateHabitRecord).mockResolvedValue()
  vi.mocked(service.addEntryRecord).mockResolvedValue()
  vi.mocked(service.deleteEntryRecord).mockResolvedValue()
  vi.mocked(service.deleteHabitRecord).mockResolvedValue()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('hydrateHabitStore', () => {
  it('hydrates normalized records once for concurrent callers', async () => {
    const first = habit({ id: 'habit-1' })
    const second = habit({ id: 'habit-2' })
    const firstEntry = entry({ habitId: first.id })
    const secondEntry = entry({ id: 'entry-2', habitId: second.id, day: date(2) })
    const loading = deferred<HabitData>()
    vi.mocked(service.loadHabitData).mockReturnValueOnce(loading.promise)

    const firstHydration = actions.hydrateHabitStore()
    const secondHydration = actions.hydrateHabitStore()

    expect(service.loadHabitData).toHaveBeenCalledTimes(1)
    expect(useHabitStore.getState().hydrationStatus).toBe('loading')

    loading.resolve({ habits: [first, second], entries: [firstEntry, secondEntry] })
    await Promise.all([firstHydration, secondHydration])

    expect(useHabitStore.getState()).toMatchObject({
      hydrationStatus: 'ready',
      habitIds: [first.id, second.id],
      habitsById: { [first.id]: first, [second.id]: second },
      entriesByHabitId: {
        [first.id]: { [firstEntry.day.toISOString()]: firstEntry },
        [second.id]: { [secondEntry.day.toISOString()]: secondEntry },
      },
    })
  })

  it('rejects, records the error, and can retry after a failed hydration', async () => {
    const failure = new Error('IndexedDB unavailable')
    vi.mocked(service.loadHabitData).mockRejectedValueOnce(failure)

    await expect(actions.hydrateHabitStore()).rejects.toBe(failure)
    expect(useHabitStore.getState()).toMatchObject({
      hydrationStatus: 'error',
      hydrationError: failure,
    })

    const loaded = habit()
    vi.mocked(service.loadHabitData).mockResolvedValueOnce({ habits: [loaded], entries: [] })
    await expect(actions.hydrateHabitStore()).resolves.toBeUndefined()
    expect(service.loadHabitData).toHaveBeenCalledTimes(2)
    expect(useHabitStore.getState().habitsById).toEqual({ [loaded.id]: loaded })
  })
})

describe('form mutations', () => {
  it('automatically hydrates and adds a habit only after persistence succeeds', async () => {
    const persisted = deferred<void>()
    const now = date(3, 1, 10)
    vi.setSystemTime(now)
    vi.mocked(service.addHabitRecord).mockReturnValueOnce(persisted.promise)

    const result = actions.addHabit({
      name: '  Exercise  ',
      description: '  Daily  ',
      schedule,
    })
    await waitForActions()

    expect(service.loadHabitData).toHaveBeenCalledTimes(1)
    expect(service.addHabitRecord).toHaveBeenCalledWith({
      id: 'generated-id',
      name: 'Exercise',
      description: 'Daily',
      schedule,
      createdAt: now,
      updatedAt: now,
    })
    expect(useHabitStore.getState().habitIds).toEqual([])

    persisted.resolve()
    await result
    expect(useHabitStore.getState().habitIds).toEqual(['generated-id'])
  })

  it('leaves the store unchanged when adding fails', async () => {
    setReadyStore()
    const failure = new Error('write failed')
    vi.mocked(service.addHabitRecord).mockRejectedValueOnce(failure)

    await expect(actions.addHabit({ name: 'Read', schedule })).rejects.toBe(failure)
    expect(useHabitStore.getState().habitIds).toEqual([])
  })

  it('edits a habit only after persistence succeeds', async () => {
    const existing = habit()
    const persisted = deferred<void>()
    setReadyStore([existing])
    vi.mocked(service.updateHabitRecord).mockReturnValueOnce(persisted.promise)

    const result = actions.editHabit({ id: existing.id, name: '  Exercise  ' })
    await waitForActions()

    expect(useHabitStore.getState().habitsById[existing.id]).toEqual(existing)
    expect(service.updateHabitRecord).toHaveBeenCalledWith(
      expect.objectContaining({ id: existing.id, name: 'Exercise' }),
    )

    persisted.resolve()
    await result
    expect(useHabitStore.getState().habitsById[existing.id]).toEqual(
      expect.objectContaining({ name: 'Exercise' }),
    )
  })

  it('leaves the store unchanged when editing fails', async () => {
    const existing = habit()
    setReadyStore([existing])
    vi.mocked(service.updateHabitRecord).mockRejectedValueOnce(new Error('write failed'))

    await expect(actions.editHabit({ id: existing.id, name: 'Exercise' })).rejects.toThrow(
      'write failed',
    )
    expect(useHabitStore.getState().habitsById[existing.id]).toEqual(existing)
  })

  it('removes a habit from the store only after persistence succeeds', async () => {
    const existing = habit()
    const existingEntry = entry()
    const persisted = deferred<void>()
    setReadyStore([existing], [existingEntry])
    vi.mocked(service.deleteHabitRecord).mockReturnValueOnce(persisted.promise)

    const result = actions.deleteHabit(existing.id)
    await waitForActions()

    expect(useHabitStore.getState().habitsById[existing.id]).toEqual(existing)
    expect(useHabitStore.getState().entriesByHabitId[existing.id]).toEqual({
      [existingEntry.day.toISOString()]: existingEntry,
    })

    persisted.resolve()
    await result
    expect(useHabitStore.getState().habitsById[existing.id]).toBeUndefined()
    expect(useHabitStore.getState().entriesByHabitId[existing.id]).toBeUndefined()
  })

  it('leaves the store unchanged when deleting fails', async () => {
    const existing = habit()
    setReadyStore([existing])
    vi.mocked(service.deleteHabitRecord).mockRejectedValueOnce(new Error('write failed'))

    await expect(actions.deleteHabit(existing.id)).rejects.toThrow('write failed')
    expect(useHabitStore.getState().habitsById[existing.id]).toEqual(existing)
  })
})

describe('toggleDay', () => {
  it('adds an entry optimistically and removes it if persistence fails', async () => {
    const existing = habit()
    const day = date(2)
    const persisted = deferred<void>()
    setReadyStore([existing])
    vi.mocked(service.addEntryRecord).mockReturnValueOnce(persisted.promise)

    const result = actions.toggleDay({ habitId: existing.id, day })
    await waitForActions()

    expect(useHabitStore.getState().entriesByHabitId[existing.id]?.[day.toISOString()]).toEqual(
      expect.objectContaining({ habitId: existing.id, day }),
    )

    persisted.reject(new Error('write failed'))
    await expect(result).rejects.toThrow('write failed')
    expect(
      useHabitStore.getState().entriesByHabitId[existing.id]?.[day.toISOString()],
    ).toBeUndefined()
  })

  it('removes an entry optimistically and restores it if persistence fails', async () => {
    const existing = habit()
    const existingEntry = entry()
    setReadyStore([existing], [existingEntry])
    vi.mocked(service.deleteEntryRecord).mockRejectedValueOnce(new Error('write failed'))

    const result = actions.toggleDay({ habitId: existing.id, day: existingEntry.day })
    await waitForActions()
    expect(
      useHabitStore.getState().entriesByHabitId[existing.id]?.[existingEntry.day.toISOString()],
    ).toBeUndefined()

    await expect(result).rejects.toThrow('write failed')
    expect(
      useHabitStore.getState().entriesByHabitId[existing.id]?.[existingEntry.day.toISOString()],
    ).toEqual(existingEntry)
  })

  it('serializes rapid toggles for one habit', async () => {
    const existing = habit()
    const day = date(2)
    const added = deferred<void>()
    const deleted = deferred<void>()
    setReadyStore([existing])
    vi.mocked(service.addEntryRecord).mockReturnValueOnce(added.promise)
    vi.mocked(service.deleteEntryRecord).mockReturnValueOnce(deleted.promise)

    const firstToggle = actions.toggleDay({ habitId: existing.id, day })
    await waitForActions()
    const secondToggle = actions.toggleDay({ habitId: existing.id, day })
    await waitForActions()

    expect(service.deleteEntryRecord).not.toHaveBeenCalled()
    added.resolve()
    await firstToggle
    await waitForActions()
    expect(service.deleteEntryRecord).toHaveBeenCalledWith({ habitId: existing.id, day })

    deleted.resolve()
    await secondToggle
    expect(
      useHabitStore.getState().entriesByHabitId[existing.id]?.[day.toISOString()],
    ).toBeUndefined()
  })

  it('queues deletion behind an earlier toggle for the same habit', async () => {
    const existing = habit()
    const added = deferred<void>()
    const deleted = deferred<void>()
    setReadyStore([existing])
    vi.mocked(service.addEntryRecord).mockReturnValueOnce(added.promise)
    vi.mocked(service.deleteHabitRecord).mockReturnValueOnce(deleted.promise)

    const toggle = actions.toggleDay({ habitId: existing.id, day: date(2) })
    await waitForActions()
    const deletion = actions.deleteHabit(existing.id)
    await waitForActions()

    expect(service.deleteHabitRecord).not.toHaveBeenCalled()
    added.resolve()
    await toggle
    await waitForActions()
    expect(service.deleteHabitRecord).toHaveBeenCalledWith(existing.id)

    deleted.resolve()
    await deletion
    expect(useHabitStore.getState().habitsById[existing.id]).toBeUndefined()
  })

  it('rejects an absent habit without persisting an orphan entry', async () => {
    setReadyStore()

    await expect(actions.toggleDay({ habitId: 'missing', day: date(1) })).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect(service.addEntryRecord).not.toHaveBeenCalled()
    expect(useHabitStore.getState().entriesByHabitId).toEqual({})
  })
})
