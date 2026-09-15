import { v7 as uuidv7 } from 'uuid'
import type { StoreApi } from 'zustand'

import { EntityNotFoundError, type Entry, type Habit, type Schedule } from '~/shared/db'
import { toError } from '~/shared/lib'

import { type HabitData, type HabitRepository, repository } from './repository'
import { getDayKey, type HabitStore, useHabitStore } from './store'

type HabitStoreApi = Pick<StoreApi<HabitStore>, 'getState' | 'setState'>

type HabitDataState = Pick<HabitStore, 'habitIds' | 'habitsById' | 'entriesByHabitId'>

export const getLoadingHabitState = (): HabitStore => ({
  hydrationStatus: 'loading',
  hydrationError: null,
  habitIds: [],
  habitsById: {},
  entriesByHabitId: {},
})

export const getHydratedHabitState = ({ habits, entries }: HabitData): HabitDataState => ({
  habitIds: habits.map(({ id }) => id),
  habitsById: Object.fromEntries(habits.map((habit) => [habit.id, habit])),
  entriesByHabitId: entries.reduce<Record<string, Record<string, Entry>>>((acc, entry) => {
    acc[entry.habitId] = {
      ...acc[entry.habitId],
      [getDayKey(entry.day)]: entry,
    }
    return acc
  }, {}),
})

export const addHabitToStore = (state: HabitStore, habit: Habit): HabitDataState => ({
  habitsById: { ...state.habitsById, [habit.id]: habit },
  habitIds: [...state.habitIds, habit.id],
  entriesByHabitId: state.entriesByHabitId,
})

export const updateHabitInStore = (state: HabitStore, habit: Habit): HabitDataState => ({
  habitsById: { ...state.habitsById, [habit.id]: habit },
  habitIds: state.habitIds,
  entriesByHabitId: state.entriesByHabitId,
})

export const removeHabitFromStore = (state: HabitStore, id: string): HabitDataState => {
  const habitsById = { ...state.habitsById }
  delete habitsById[id]

  const entriesByHabitId = { ...state.entriesByHabitId }
  delete entriesByHabitId[id]

  return {
    habitsById,
    habitIds: state.habitIds.filter((habitId) => habitId !== id),
    entriesByHabitId,
  }
}

export const addEntryToStore = (state: HabitStore, entry: Entry): HabitDataState => ({
  habitsById: state.habitsById,
  habitIds: state.habitIds,
  entriesByHabitId: {
    ...state.entriesByHabitId,
    [entry.habitId]: {
      ...state.entriesByHabitId[entry.habitId],
      [getDayKey(entry.day)]: entry,
    },
  },
})

export const removeEntryFromStore = (
  state: HabitStore,
  { habitId, day }: Pick<Entry, 'habitId' | 'day'>,
): HabitDataState => {
  const entriesByDay = { ...state.entriesByHabitId[habitId] }
  delete entriesByDay[getDayKey(day)]

  return {
    habitsById: state.habitsById,
    habitIds: state.habitIds,
    entriesByHabitId: { ...state.entriesByHabitId, [habitId]: entriesByDay },
  }
}

export interface HabitActionDependencies {
  store: HabitStoreApi
  repository: HabitRepository
  now?: () => Date
  generateId?: () => string
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
    const prev = habitQueues.get(habitId) ?? Promise.resolve()
    const next = prev.catch(() => {}).then(operation)
    habitQueues.set(habitId, next)

    return next.finally(() => {
      if (habitQueues.get(habitId) === next) habitQueues.delete(habitId)
    })
  }

  const hydrate = async () => {
    store.setState(getLoadingHabitState())

    try {
      const data = await repository.loadData()
      store.setState({
        hydrationStatus: 'ready',
        hydrationError: null,
        ...getHydratedHabitState(data),
      })
    } catch (error) {
      store.setState({ hydrationStatus: 'error', hydrationError: toError(error) })
      throw error
    }
  }

  const hydrateHabitStore = () => {
    if (hydrationPromise) return hydrationPromise

    const pending = hydrate()
    hydrationPromise = pending
    void pending.catch(() => {
      if (hydrationPromise === pending) hydrationPromise = null
    })
    return pending
  }

  const ensureHydrated = async () => {
    if (store.getState().hydrationStatus !== 'ready') await hydrateHabitStore()
  }

  const addHabit = async ({
    name,
    description,
    schedule,
  }: {
    name: string
    description?: string
    schedule: Schedule
  }): Promise<void> => {
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
    store.setState((state) => addHabitToStore(state, habit))
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
  }): Promise<void> => {
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
    store.setState((state) => updateHabitInStore(state, habit))
  }

  const toggleDay = async ({ habitId, day }: { habitId: string; day: Date }): Promise<void> => {
    await ensureHydrated()

    const state = store.getState()
    if (!state.habitsById[habitId]) throw new EntityNotFoundError('Habit', habitId)

    const existingEntry = state.entriesByHabitId[habitId]?.[getDayKey(day)]
    if (existingEntry) {
      store.setState((current) => removeEntryFromStore(current, existingEntry))

      await enqueueHabitOperation(habitId, async () => {
        try {
          await repository.deleteEntryRecord({ habitId, day })
        } catch (error) {
          store.setState((current) =>
            current.entriesByHabitId[habitId]?.[getDayKey(day)]
              ? {}
              : addEntryToStore(current, existingEntry),
          )
          throw error
        }
      })
      return
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

    store.setState((current) => addEntryToStore(current, entry))

    await enqueueHabitOperation(habitId, async () => {
      try {
        await repository.addEntryRecord(entry)
      } catch (error) {
        store.setState((current) =>
          current.entriesByHabitId[habitId]?.[getDayKey(day)] === entry
            ? removeEntryFromStore(current, entry)
            : {},
        )
        throw error
      }
    })
  }

  const deleteHabit = async (id: string): Promise<void> => {
    await ensureHydrated()
    await enqueueHabitOperation(id, () => repository.deleteHabitRecord(id))
    store.setState((state) => removeHabitFromStore(state, id))
  }

  return { hydrateHabitStore, addHabit, editHabit, toggleDay, deleteHabit }
}

export const { hydrateHabitStore, addHabit, editHabit, toggleDay, deleteHabit } =
  createHabitActions({ store: useHabitStore, repository })
