import { describe, expect, it, vi } from 'vitest'
import { createStore } from 'zustand/vanilla'

import type { Entry } from '~/shared/api'
import { Day } from '~/shared/lib'
import { date, day } from '~/shared/tests'

import { createHabitActions } from './actions'
import type { HabitData, HabitRepository } from './repository'
import { createHabitState, type HabitState } from './store'
import { makeEntry, makeHabit } from './testUtils'

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

const settle = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

const mockRepository = (data: HabitData = { habits: [], entries: [] }) =>
  ({
    loadData: vi.fn(async () => data),
    addHabitRecord: vi.fn(async () => {}),
    updateHabitRecord: vi.fn(async () => {}),
    getEntryRecord: vi.fn(async (): Promise<Entry | null> => null),
    addEntryRecord: vi.fn(async () => {}),
    deleteEntryRecord: vi.fn(async () => {}),
    deleteHabitRecord: vi.fn(async () => {}),
  }) satisfies HabitRepository

const createTestActions = ({
  repository = mockRepository(),
  state = createHabitState(),
}: {
  repository?: HabitRepository
  state?: HabitState
} = {}) => {
  const store = createStore<HabitState>()(() => state)
  return {
    actions: createHabitActions({
      store,
      repository,
      now: () => date(3),
      generateId: () => 'generated-id',
    }),
    repository,
    store,
  }
}

describe('Habit actions', () => {
  it('hydrates one internally consistent dataset for concurrent callers', async () => {
    const first = makeHabit({ id: 'first', createdAt: date(2) })
    const second = makeHabit({ id: 'second', createdAt: date(1) })
    const entry = makeEntry({ habitId: first.id, day: day(2) })
    const orphan = makeEntry({ id: 'orphan', habitId: 'missing', day: day(3) })
    const loading = deferred<HabitData>()
    const repository = mockRepository()
    repository.loadData.mockReturnValueOnce(loading.promise)
    const { actions, store } = createTestActions({ repository })

    const firstHydration = actions.hydrateHabitStore()
    const secondHydration = actions.hydrateHabitStore()

    expect(repository.loadData).toHaveBeenCalledTimes(1)
    expect(store.getState().hydrationStatus).toBe('loading')
    loading.resolve({ habits: [first, second], entries: [entry, orphan] })
    await Promise.all([firstHydration, secondHydration])

    expect(store.getState()).toMatchObject({
      hydrationStatus: 'ready',
      habitsById: { first, second },
      entriesByHabitId: {
        first: { [entry.day]: entry },
        second: {},
      },
    })
    expect(store.getState().entriesByHabitId.missing).toBeUndefined()
  })

  it('keeps a failed hydration observable and lets a later action retry it', async () => {
    const failure = new Error('IndexedDB unavailable')
    const habit = makeHabit()
    const repository = mockRepository()
    repository.loadData
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ habits: [habit], entries: [] })
    const { actions, store } = createTestActions({ repository })

    await expect(actions.hydrateHabitStore()).rejects.toBe(failure)
    expect(store.getState()).toMatchObject({ hydrationStatus: 'error', hydrationError: failure })

    await actions.editHabit({ id: habit.id, name: 'Exercise' })
    expect(repository.loadData).toHaveBeenCalledTimes(2)
    expect(store.getState().habitsById[habit.id]).toMatchObject({ name: 'Exercise' })
  })

  it('adds a Habit and its empty Entry record only after persistence succeeds', async () => {
    const saved = deferred<void>()
    const repository = mockRepository({ habits: [], entries: [] })
    repository.addHabitRecord.mockReturnValueOnce(saved.promise)
    const { actions, store } = createTestActions({ repository })

    const added = actions.addHabit({
      name: '  Exercise  ',
      description: '  Daily  ',
      schedule: makeHabit().schedule,
    })
    await settle()

    expect(repository.addHabitRecord).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'generated-id', name: 'Exercise', description: 'Daily' }),
    )
    expect(store.getState().habitsById).toEqual({})
    saved.resolve()
    await added

    expect(store.getState()).toMatchObject({
      habitsById: { 'generated-id': expect.objectContaining({ id: 'generated-id' }) },
      entriesByHabitId: { 'generated-id': {} },
    })
  })

  it('keeps edits pessimistic and replaces the existing Habit on success', async () => {
    const first = makeHabit({ id: 'first' })
    const second = makeHabit({ id: 'second' })
    const saved = deferred<void>()
    const repository = mockRepository({ habits: [first, second], entries: [] })
    repository.updateHabitRecord.mockReturnValueOnce(saved.promise)
    const { actions, store } = createTestActions({ repository })

    const edited = actions.editHabit({ id: first.id, name: 'Exercise' })
    await settle()
    expect(store.getState().habitsById).toEqual({ first, second })
    saved.resolve()
    await edited

    expect(store.getState().habitsById).toEqual({
      first: expect.objectContaining({ name: 'Exercise' }),
      second,
    })
  })

  it('optimistically toggles a Day and rolls it back when persistence fails', async () => {
    const habit = makeHabit()
    const failed = deferred<void>()
    const repository = mockRepository({ habits: [habit], entries: [] })
    repository.addEntryRecord.mockReturnValueOnce(failed.promise)
    const { actions, store } = createTestActions({ repository })
    await actions.hydrateHabitStore()

    const toggled = actions.toggleDay({ habitId: habit.id, day: day(2) })
    await settle()
    expect(store.getState().entriesByHabitId[habit.id]?.[day(2).value]).toMatchObject({
      habitId: habit.id,
    })

    failed.reject(new Error('write failed'))
    await expect(toggled).rejects.toThrow('write failed')
    expect(store.getState().entriesByHabitId[habit.id]).toEqual({})
  })

  it('preserves newer toggle intent when an older persistence operation fails', async () => {
    const habit = makeHabit()
    const failed = deferred<void>()
    const repository = mockRepository({ habits: [habit], entries: [] })
    repository.addEntryRecord.mockReturnValueOnce(failed.promise)
    const { actions, store } = createTestActions({ repository })
    await actions.hydrateHabitStore()

    const first = actions.toggleDay({ habitId: habit.id, day: day(2) })
    await settle()
    const second = actions.toggleDay({ habitId: habit.id, day: day(2) })
    await settle()
    expect(store.getState().entriesByHabitId[habit.id]).toEqual({})

    failed.reject(new Error('add failed'))
    await expect(first).rejects.toThrow('add failed')
    await second
    expect(repository.deleteEntryRecord).not.toHaveBeenCalled()
    expect(store.getState().entriesByHabitId[habit.id]).toEqual({})
  })

  it('uses the persisted Entry after a failed removal instead of adding a duplicate', async () => {
    const habit = makeHabit()
    const entry = makeEntry({ habitId: habit.id, day: day(2) })
    const failedDeletion = deferred<void>()
    const repository = mockRepository({ habits: [habit], entries: [entry] })
    repository.getEntryRecord.mockResolvedValue(entry)
    repository.deleteEntryRecord.mockReturnValueOnce(failedDeletion.promise)
    const { actions, store } = createTestActions({ repository })
    await actions.hydrateHabitStore()

    const removal = actions.toggleDay({ habitId: habit.id, day: new Day(entry.day) })
    await settle()
    const completion = actions.toggleDay({ habitId: habit.id, day: new Day(entry.day) })
    await settle()

    failedDeletion.reject(new Error('delete failed'))
    await expect(removal).rejects.toThrow('delete failed')
    await completion

    expect(repository.getEntryRecord).toHaveBeenCalledTimes(2)
    expect(repository.addEntryRecord).not.toHaveBeenCalled()
    expect(store.getState().entriesByHabitId[habit.id]?.[entry.day]).toBeDefined()
  })

  it('serializes mutations for one Habit while allowing another Habit to persist independently', async () => {
    const first = makeHabit({ id: 'first' })
    const second = makeHabit({ id: 'second' })
    const firstSave = deferred<void>()
    const secondSave = deferred<void>()
    const repository = mockRepository({ habits: [first, second], entries: [] })
    repository.updateHabitRecord
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise)
    const { actions } = createTestActions({ repository })
    await actions.hydrateHabitStore()

    const firstEdit = actions.editHabit({ id: first.id, name: 'First edit' })
    const firstToggle = actions.toggleDay({ habitId: first.id, day: day(2) })
    const secondEdit = actions.editHabit({ id: second.id, name: 'Second edit' })
    await settle()

    expect(repository.updateHabitRecord).toHaveBeenCalledTimes(2)
    expect(repository.addEntryRecord).not.toHaveBeenCalled()
    secondSave.resolve()
    await secondEdit
    firstSave.resolve()
    await firstEdit
    await firstToggle
    expect(repository.addEntryRecord).toHaveBeenCalledTimes(1)
  })

  it('serializes deletion behind earlier mutations and permits retry after failure', async () => {
    const habit = makeHabit()
    const added = deferred<void>()
    const failed = deferred<void>()
    const repository = mockRepository({ habits: [habit], entries: [] })
    repository.addEntryRecord.mockReturnValueOnce(added.promise)
    repository.deleteHabitRecord.mockReturnValueOnce(failed.promise)
    const { actions, store } = createTestActions({ repository })
    await actions.hydrateHabitStore()

    const toggle = actions.toggleDay({ habitId: habit.id, day: day(2) })
    await settle()
    const deletion = actions.deleteHabit(habit.id)
    await settle()
    expect(repository.deleteHabitRecord).not.toHaveBeenCalled()
    added.resolve()
    await toggle
    await settle()
    expect(repository.deleteHabitRecord).toHaveBeenCalledWith(habit.id)
    failed.reject(new Error('delete failed'))
    await expect(deletion).rejects.toThrow('delete failed')

    await actions.deleteHabit(habit.id)
    expect(store.getState().habitsById[habit.id]).toBeUndefined()
    expect(store.getState().entriesByHabitId[habit.id]).toBeUndefined()
  })
})
