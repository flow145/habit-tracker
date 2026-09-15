import { describe, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'

import { EntityNotFoundError, type Entry, type Habit } from '~/shared/db'
import { date, makeEntry, makeHabit } from '~/shared/tests'

import {
  addEntryToStore,
  addHabitToStore,
  createHabitActions,
  getHydratedHabitState,
  getLoadingHabitState,
  removeEntryFromStore,
  removeHabitFromStore,
  updateHabitInStore,
} from './actions'
import type { HabitData, HabitRepository } from './repository'
import type { HabitStore } from './store'

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

const emptyStore = (): HabitStore => ({
  hydrationStatus: 'idle',
  hydrationError: null,
  habitIds: [],
  habitsById: {},
  entriesByHabitId: {},
})

const readyStore = (habits: Habit[] = [], entries: Entry[] = []): HabitStore => ({
  hydrationStatus: 'ready',
  hydrationError: null,
  ...getHydratedHabitState({ habits, entries }),
})

const createRepositoryMock = (data: HabitData = { habits: [], entries: [] }) =>
  ({
    loadData: vi.fn(async () => data),
    addHabitRecord: vi.fn(async () => {}),
    updateHabitRecord: vi.fn(async () => {}),
    addEntryRecord: vi.fn(async () => {}),
    deleteEntryRecord: vi.fn(async () => {}),
    deleteHabitRecord: vi.fn(async () => {}),
  }) satisfies HabitRepository

const createTestActions = ({
  state = emptyStore(),
  repository = createRepositoryMock(),
}: {
  state?: HabitStore
  repository?: HabitRepository
} = {}) => {
  const store = createStore<HabitStore>()(() => state)
  const actions = createHabitActions({
    store,
    repository,
    now: () => date(3, 1, 10),
    generateId: () => 'generated-id',
  })
  return { store, actions }
}

const waitForActions = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('store mutations', () => {
  it('normalizes hydrated data by habit and day', () => {
    const firstHabit = makeHabit({ id: 'habit-1' })
    const secondHabit = makeHabit({ id: 'habit-2' })
    const firstEntry = makeEntry({ habitId: firstHabit.id })
    const secondEntry = makeEntry({ id: 'entry-2', habitId: secondHabit.id, day: date(2) })

    expect(
      getHydratedHabitState({
        habits: [firstHabit, secondHabit],
        entries: [firstEntry, secondEntry],
      }),
    ).toEqual({
      habitIds: [firstHabit.id, secondHabit.id],
      habitsById: { [firstHabit.id]: firstHabit, [secondHabit.id]: secondHabit },
      entriesByHabitId: {
        [firstHabit.id]: { [firstEntry.day.toISOString()]: firstEntry },
        [secondHabit.id]: { [secondEntry.day.toISOString()]: secondEntry },
      },
    })
  })

  it('adds, updates, and removes habits without changing unrelated entries', () => {
    const firstHabit = makeHabit({ id: 'habit-1' })
    const secondHabit = makeHabit({ id: 'habit-2', name: 'Exercise' })
    const firstEntry = makeEntry({ habitId: firstHabit.id })
    const initial = readyStore([firstHabit], [firstEntry])

    const added = addHabitToStore(initial, secondHabit)
    const updated = updateHabitInStore({ ...initial, ...added }, { ...secondHabit, name: 'Move' })
    const removed = removeHabitFromStore({ ...initial, ...updated }, firstHabit.id)

    expect(added.habitIds).toEqual([firstHabit.id, secondHabit.id])
    expect(updated.habitsById[secondHabit.id]?.name).toBe('Move')
    expect(removed).toEqual({
      habitIds: [secondHabit.id],
      habitsById: { [secondHabit.id]: { ...secondHabit, name: 'Move' } },
      entriesByHabitId: {},
    })
  })

  it('adds and removes an entry by its habit and day', () => {
    const habit = makeHabit()
    const entry = makeEntry({ habitId: habit.id, day: date(2) })
    const initial = readyStore([habit])

    const added = addEntryToStore(initial, entry)
    const removed = removeEntryFromStore({ ...initial, ...added }, entry)

    expect(added.entriesByHabitId[habit.id]?.[entry.day.toISOString()]).toEqual(entry)
    expect(removed.entriesByHabitId[habit.id]).toEqual({})
  })
})

describe('habit actions', () => {
  it('hydrate normalized records once for concurrent callers', async () => {
    const firstHabit = makeHabit({ id: 'habit-1' })
    const secondHabit = makeHabit({ id: 'habit-2' })
    const loading = deferred<HabitData>()
    const repository = createRepositoryMock()
    repository.loadData.mockReturnValueOnce(loading.promise)
    const { store, actions } = createTestActions({ repository })

    const firstHydration = actions.hydrateHabitStore()
    const secondHydration = actions.hydrateHabitStore()

    expect(repository.loadData).toHaveBeenCalledTimes(1)
    expect(store.getState()).toEqual(getLoadingHabitState())

    loading.resolve({ habits: [firstHabit, secondHabit], entries: [] })
    await Promise.all([firstHydration, secondHydration])
    expect(store.getState()).toMatchObject({
      hydrationStatus: 'ready',
      habitIds: [firstHabit.id, secondHabit.id],
    })
  })

  it('record a hydration failure and retry with the same action instance', async () => {
    const failure = new Error('IndexedDB unavailable')
    const repository = createRepositoryMock()
    repository.loadData.mockRejectedValueOnce(failure).mockResolvedValueOnce({
      habits: [makeHabit()],
      entries: [],
    })
    const { store, actions } = createTestActions({ repository })

    await expect(actions.hydrateHabitStore()).rejects.toBe(failure)
    expect(store.getState()).toMatchObject({ hydrationStatus: 'error', hydrationError: failure })

    await actions.hydrateHabitStore()
    expect(repository.loadData).toHaveBeenCalledTimes(2)
    expect(store.getState().hydrationStatus).toBe('ready')
  })

  it('persist form mutations before changing the store', async () => {
    const persisted = deferred<void>()
    const repository = createRepositoryMock()
    repository.addHabitRecord.mockReturnValueOnce(persisted.promise)
    const { store, actions } = createTestActions({ repository, state: readyStore() })

    const result = actions.addHabit({
      name: '  Exercise  ',
      description: '  Daily  ',
      schedule: makeHabit().schedule,
    })
    await waitForActions()

    expect(repository.addHabitRecord).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'generated-id', name: 'Exercise', description: 'Daily' }),
    )
    expect(store.getState().habitIds).toEqual([])

    persisted.resolve()
    await result
    expect(store.getState().habitIds).toEqual(['generated-id'])
  })

  it('keep form state unchanged when persistence fails', async () => {
    const habit = makeHabit()
    const repository = createRepositoryMock()
    repository.updateHabitRecord.mockRejectedValueOnce(new Error('write failed'))
    const { store, actions } = createTestActions({ repository, state: readyStore([habit]) })

    await expect(actions.editHabit({ id: habit.id, name: 'Exercise' })).rejects.toThrow(
      'write failed',
    )
    expect(store.getState().habitsById[habit.id]).toEqual(habit)
  })

  it('edit a habit only after persistence succeeds', async () => {
    const habit = makeHabit()
    const persisted = deferred<void>()
    const repository = createRepositoryMock()
    repository.updateHabitRecord.mockReturnValueOnce(persisted.promise)
    const { store, actions } = createTestActions({ repository, state: readyStore([habit]) })

    const result = actions.editHabit({ id: habit.id, name: '  Exercise  ' })
    await waitForActions()

    expect(repository.updateHabitRecord).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Exercise' }),
    )
    expect(store.getState().habitsById[habit.id]).toEqual(habit)

    persisted.resolve()
    await result
    expect(store.getState().habitsById[habit.id]).toEqual(
      expect.objectContaining({ name: 'Exercise' }),
    )
  })

  it('keep a habit in the store when deletion fails', async () => {
    const habit = makeHabit()
    const repository = createRepositoryMock()
    repository.deleteHabitRecord.mockRejectedValueOnce(new Error('write failed'))
    const { store, actions } = createTestActions({ repository, state: readyStore([habit]) })

    await expect(actions.deleteHabit(habit.id)).rejects.toThrow('write failed')
    expect(store.getState().habitsById[habit.id]).toEqual(habit)
  })

  it('apply an optimistic toggle and roll it back when persistence fails', async () => {
    const habit = makeHabit()
    const persisted = deferred<void>()
    const repository = createRepositoryMock()
    repository.addEntryRecord.mockReturnValueOnce(persisted.promise)
    const { store, actions } = createTestActions({ repository, state: readyStore([habit]) })

    const result = actions.toggleDay({ habitId: habit.id, day: date(2) })
    await waitForActions()
    expect(store.getState().entriesByHabitId[habit.id]?.[date(2).toISOString()]).toEqual(
      expect.objectContaining({ habitId: habit.id }),
    )

    persisted.reject(new Error('write failed'))
    await expect(result).rejects.toThrow('write failed')
    expect(store.getState().entriesByHabitId[habit.id]?.[date(2).toISOString()]).toBeUndefined()
  })

  it('restore an optimistically removed entry when persistence fails', async () => {
    const habit = makeHabit()
    const entry = makeEntry({ habitId: habit.id })
    const persisted = deferred<void>()
    const repository = createRepositoryMock()
    repository.deleteEntryRecord.mockReturnValueOnce(persisted.promise)
    const { store, actions } = createTestActions({
      repository,
      state: readyStore([habit], [entry]),
    })

    const result = actions.toggleDay({ habitId: habit.id, day: entry.day })
    await waitForActions()
    expect(store.getState().entriesByHabitId[habit.id]?.[entry.day.toISOString()]).toBeUndefined()

    persisted.reject(new Error('write failed'))
    await expect(result).rejects.toThrow('write failed')
    expect(store.getState().entriesByHabitId[habit.id]?.[entry.day.toISOString()]).toEqual(entry)
  })

  it('serialize rapid toggles for the same habit', async () => {
    const habit = makeHabit()
    const added = deferred<void>()
    const deleted = deferred<void>()
    const repository = createRepositoryMock()
    repository.addEntryRecord.mockReturnValueOnce(added.promise)
    repository.deleteEntryRecord.mockReturnValueOnce(deleted.promise)
    const { store, actions } = createTestActions({ repository, state: readyStore([habit]) })

    const firstToggle = actions.toggleDay({ habitId: habit.id, day: date(2) })
    await waitForActions()
    const secondToggle = actions.toggleDay({ habitId: habit.id, day: date(2) })
    await waitForActions()

    expect(repository.deleteEntryRecord).not.toHaveBeenCalled()
    added.resolve()
    await firstToggle
    await waitForActions()
    expect(repository.deleteEntryRecord).toHaveBeenCalledWith({
      habitId: habit.id,
      day: date(2),
    })

    deleted.resolve()
    await secondToggle
    expect(store.getState().entriesByHabitId[habit.id]?.[date(2).toISOString()]).toBeUndefined()
  })

  it('serialize a deletion behind an earlier toggle for the same habit', async () => {
    const habit = makeHabit()
    const added = deferred<void>()
    const deleted = deferred<void>()
    const repository = createRepositoryMock()
    repository.addEntryRecord.mockReturnValueOnce(added.promise)
    repository.deleteHabitRecord.mockReturnValueOnce(deleted.promise)
    const { store, actions } = createTestActions({ repository, state: readyStore([habit]) })

    const toggle = actions.toggleDay({ habitId: habit.id, day: date(2) })
    await waitForActions()
    const deletion = actions.deleteHabit(habit.id)
    await waitForActions()

    expect(repository.deleteHabitRecord).not.toHaveBeenCalled()
    added.resolve()
    await toggle
    await waitForActions()
    expect(repository.deleteHabitRecord).toHaveBeenCalledWith(habit.id)

    deleted.resolve()
    await deletion
    expect(store.getState().habitsById[habit.id]).toBeUndefined()
  })

  it('reject toggles for absent habits without persisting an orphan entry', async () => {
    const repository = createRepositoryMock()
    const { store, actions } = createTestActions({ repository, state: readyStore() })

    await expect(actions.toggleDay({ habitId: 'missing', day: date(1) })).rejects.toThrow(
      new EntityNotFoundError('Habit', 'missing'),
    )
    expect(repository.addEntryRecord).not.toHaveBeenCalled()
    expect(store.getState().entriesByHabitId).toEqual({})
  })
})
