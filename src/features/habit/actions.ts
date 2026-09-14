import { v7 as uuidv7 } from 'uuid'

import { EntityNotFoundError, type Entry, type Habit, type Schedule } from '~/shared/db'
import { toError } from '~/shared/lib'

import {
  addEntryRecord,
  addHabitRecord,
  deleteEntryRecord,
  deleteHabitRecord,
  loadHabitData,
  updateHabitRecord,
} from './service'
import { getDayKey, useHabitStore } from './store'

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
  useHabitStore.setState({
    hydrationStatus: 'loading',
    hydrationError: null,
    habitIds: [],
    habitsById: {},
    entriesByHabitId: {},
  })

  try {
    const { habits, entries } = await loadHabitData()
    useHabitStore.setState({
      hydrationStatus: 'ready',
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
  } catch (error) {
    useHabitStore.setState({
      hydrationStatus: 'error',
      hydrationError: toError(error),
    })
  }
}

const ensureHydrated = async () => {
  if (hydrationPromise) await hydrationPromise
}

export const hydrateHabitStore = () => {
  if (hydrationPromise) return hydrationPromise
  hydrationPromise = hydrate()
  return hydrationPromise
}

export const addHabit = async ({
  name,
  description,
  schedule,
}: {
  name: string
  description?: string
  schedule: Schedule
}): Promise<void> => {
  await ensureHydrated()

  const now = new Date()
  const habit: Habit = {
    id: uuidv7(),
    name: name.trim(),
    description: description?.trim() ?? '',
    schedule,
    createdAt: now,
    updatedAt: now,
  }

  useHabitStore.setState((state) => ({
    habitsById: { ...state.habitsById, [habit.id]: habit },
    habitIds: [...state.habitIds, habit.id],
  }))

  await addHabitRecord(habit)
}

export const editHabit = async ({
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

  const existing = useHabitStore.getState().habitsById[id]
  if (!existing) throw new EntityNotFoundError('Habit', id)

  const edited: Habit = {
    ...existing,
    name: name === undefined ? existing.name : name.trim(),
    description: description === undefined ? existing.description : description.trim(),
    schedule: schedule ?? existing.schedule,
    updatedAt: new Date(),
  }

  useHabitStore.setState((state) => ({
    habitsById: { ...state.habitsById, [edited.id]: edited },
  }))

  await updateHabitRecord(edited)
}

export const toggleDay = async ({
  habitId,
  day,
}: {
  habitId: string
  day: Date
}): Promise<void> => {
  await ensureHydrated()

  const { entriesByHabitId } = useHabitStore.getState()
  const entriesByDay = entriesByHabitId[habitId] ?? {}
  const dayKey = getDayKey(day)
  const existingEntry = entriesByDay[dayKey]

  if (existingEntry) {
    const updatedEntriesByDay = { ...entriesByDay }
    delete updatedEntriesByDay[dayKey]

    useHabitStore.setState({
      entriesByHabitId: { ...entriesByHabitId, [habitId]: updatedEntriesByDay },
    })

    await enqueueHabitOperation(habitId, async () => {
      try {
        await deleteEntryRecord({ habitId, day })
      } catch (error) {
        useHabitStore.setState((state) =>
          state.entriesByHabitId[habitId]?.[dayKey]
            ? state
            : {
                entriesByHabitId: {
                  ...state.entriesByHabitId,
                  [habitId]: {
                    ...state.entriesByHabitId[habitId],
                    [dayKey]: existingEntry,
                  },
                },
              },
        )

        throw error
      }
    })
  } else {
    const now = new Date()
    const entry: Entry = {
      id: uuidv7(),
      habitId,
      status: 'complete',
      day,
      createdAt: now,
      updatedAt: now,
    }

    useHabitStore.setState({
      entriesByHabitId: {
        ...entriesByHabitId,
        [habitId]: { ...entriesByDay, [dayKey]: entry },
      },
    })

    await enqueueHabitOperation(habitId, async () => {
      try {
        await addEntryRecord(entry)
      } catch (error) {
        useHabitStore.setState((state) => {
          const entriesByDay = state.entriesByHabitId[habitId]
          if (entriesByDay?.[dayKey] !== entry) return state

          const updatedEntriesByDay = { ...entriesByDay }
          delete updatedEntriesByDay[dayKey]

          return {
            entriesByHabitId: { ...state.entriesByHabitId, [habitId]: updatedEntriesByDay },
          }
        })

        throw error
      }
    })
  }
}

export const deleteHabit = async (id: string): Promise<void> => {
  await ensureHydrated()

  useHabitStore.setState((state) => {
    const habitsById = { ...state.habitsById }
    delete habitsById[id]

    const entriesByHabitId = { ...state.entriesByHabitId }
    delete entriesByHabitId[id]

    return {
      habitsById,
      habitIds: state.habitIds.filter((habitId) => habitId !== id),
      entriesByHabitId,
    }
  })

  await deleteHabitRecord(id)
}
