import { v7 as uuidv7 } from 'uuid'
import type { StoreApi } from 'zustand'

import { EntityNotFoundError, type Entry, type Habit, type Schedule } from '~/shared/api'
import { toError } from '~/shared/lib'

import { type HabitData, type HabitRepository, repository } from './repository'
import { getDayKey, type HabitState, useHabitStore } from './store'

type HabitStoreApi = Pick<StoreApi<HabitState>, 'getState' | 'setState'>

export interface HabitActionDependencies {
  store: HabitStoreApi
  repository: HabitRepository
  now?: () => Date
  generateId?: () => string
}

const removeEntry = (entries: Record<string, Entry>, dayKey: string): Record<string, Entry> => {
  const { [dayKey]: _, ...remaining } = entries
  return remaining
}

const addEntryToStore = (state: HabitState, entry: Entry) => ({
  entriesByHabitId: {
    ...state.entriesByHabitId,
    [entry.habitId]: {
      ...state.entriesByHabitId[entry.habitId],
      [getDayKey(entry.day)]: entry,
    },
  },
})

const removeEntryFromStore = (
  state: HabitState,
  { habitId, day }: Pick<Entry, 'habitId' | 'day'>,
) => {
  const entries = state.entriesByHabitId[habitId]
  if (!entries) return {}
  return {
    entriesByHabitId: {
      ...state.entriesByHabitId,
      [habitId]: removeEntry(entries, getDayKey(day)),
    },
  }
}

const getHydratedState = ({
  habits,
  entries,
}: HabitData): Omit<HabitState, 'hydrationStatus' | 'hydrationError'> => {
  const habitsById = Object.fromEntries(habits.map((habit) => [habit.id, habit]))
  const entriesByHabitId = Object.fromEntries(habits.map((habit) => [habit.id, {}])) as Record<
    string,
    Record<string, Entry>
  >

  for (const entry of entries) {
    const habitEntries = entriesByHabitId[entry.habitId]
    if (habitEntries) habitEntries[getDayKey(entry.day)] = entry
  }

  return { habits, habitsById, entriesByHabitId }
}

export const createHabitActions = ({
  store,
  repository,
  now = () => new Date(),
  generateId = uuidv7,
}: HabitActionDependencies) => {
  let hydrationPromise: Promise<void> | null = null
  const habitQueues = new Map<string, Promise<unknown>>()

  const enqueueHabitOperation = <T>(habitId: string, operation: () => Promise<T>): Promise<T> => {
    const previous = habitQueues.get(habitId) ?? Promise.resolve()
    const next = previous.catch(() => {}).then(operation)
    habitQueues.set(habitId, next)
    return next.finally(() => {
      if (habitQueues.get(habitId) === next) habitQueues.delete(habitId)
    })
  }

  const hydrate = async () => {
    store.setState({ hydrationStatus: 'loading', hydrationError: null })

    try {
      const data = await repository.loadData()
      const state = getHydratedState(data)
      store.setState({ hydrationStatus: 'ready', hydrationError: null, ...state })
    } catch (error) {
      store.setState({ hydrationStatus: 'error', hydrationError: toError(error) })
      throw error
    }
  }

  const hydrateHabitStore = () => {
    if (hydrationPromise) return hydrationPromise

    const pending = hydrate()
    hydrationPromise = pending
    const clearHydrationPromise = () => {
      if (hydrationPromise === pending) hydrationPromise = null
    }
    void pending.then(clearHydrationPromise, clearHydrationPromise)

    return pending
  }

  const ensureHydrated = () =>
    store.getState().hydrationStatus === 'ready' ? Promise.resolve() : hydrateHabitStore()

  const addHabit = async ({
    name,
    description,
    schedule,
  }: {
    name: string
    description?: string
    schedule: Schedule
  }) => {
    await ensureHydrated()

    const timestamp = now()
    const habit: Habit = {
      id: generateId(),
      name: name.trim(),
      description: description?.trim() ?? '',
      schedule,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    await repository.addHabitRecord(habit)
    store.setState((state) => ({
      habits: [...state.habits, habit],
      habitsById: { ...state.habitsById, [habit.id]: habit },
      entriesByHabitId: { ...state.entriesByHabitId, [habit.id]: {} },
    }))
  }

  const editHabit = async ({
    id,
    name,
    description,
    schedule,
  }: {
    id: string
    name?: string
    description?: string
    schedule?: Schedule
  }) => {
    await ensureHydrated()

    const existing = store.getState().habitsById[id]
    if (!existing) throw new EntityNotFoundError('Habit', id)

    const habit: Habit = {
      ...existing,
      name: name === undefined ? existing.name : name.trim(),
      description: description === undefined ? existing.description : description.trim(),
      schedule: schedule ?? existing.schedule,
      updatedAt: now(),
    }

    await repository.updateHabitRecord(habit)
    store.setState((state) => ({
      habits: state.habits.map((state) => (state.id === id ? habit : state)),
      habitsById: { ...state.habitsById, [id]: habit },
    }))
  }

  const toggleDay = async ({ habitId, day }: { habitId: string; day: Date }) => {
    await ensureHydrated()

    const { habitsById, entriesByHabitId } = store.getState()
    if (!habitsById[habitId]) throw new EntityNotFoundError('Habit', habitId)

    const dayKey = getDayKey(day)
    const existingStoreEntry = entriesByHabitId[habitId]?.[dayKey]

    if (existingStoreEntry) {
      store.setState((state) => removeEntryFromStore(state, existingStoreEntry))

      return enqueueHabitOperation(habitId, async () => {
        try {
          const existingDbEntry = await repository.getEntryRecord({ habitId, day })
          if (!existingDbEntry) return

          await repository.deleteEntryRecord({ habitId, day })
        } catch (error) {
          store.setState((state) =>
            state.entriesByHabitId[habitId]?.[getDayKey(day)]
              ? {}
              : addEntryToStore(state, existingStoreEntry),
          )
          throw error
        }
      })
    }

    const timestamp = now()
    const entry: Entry = {
      id: generateId(),
      habitId,
      status: 'complete',
      day,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    store.setState((state) => addEntryToStore(state, entry))

    return enqueueHabitOperation(habitId, async () => {
      try {
        const existingDbEntry = await repository.getEntryRecord({ habitId, day })

        if (existingDbEntry) {
          store.setState((state) =>
            state.entriesByHabitId[habitId]?.[dayKey] === entry
              ? addEntryToStore(state, existingDbEntry)
              : {},
          )
          return
        }

        await repository.addEntryRecord(entry)
      } catch (error) {
        store.setState((state) =>
          state.entriesByHabitId[habitId]?.[dayKey] === entry
            ? removeEntryFromStore(state, entry)
            : {},
        )
        throw error
      }
    })
  }

  const deleteHabit = async (id: string) => {
    await ensureHydrated()

    await enqueueHabitOperation(id, () => repository.deleteHabitRecord(id))

    const { [id]: _, ...habitsById } = store.getState().habitsById
    const { [id]: __, ...entriesByHabitId } = store.getState().entriesByHabitId
    store.setState((state) => ({
      habits: state.habits.filter((habit) => habit.id !== id),
      habitsById,
      entriesByHabitId,
    }))
  }

  return { addHabit, deleteHabit, editHabit, hydrateHabitStore, toggleDay }
}

export const { addHabit, deleteHabit, editHabit, hydrateHabitStore, toggleDay } =
  createHabitActions({
    store: useHabitStore,
    repository,
  })
