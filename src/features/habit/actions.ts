import { v7 as uuidv7 } from 'uuid'

import { EntityNotFoundError, type Entry, type Habit, type Schedule } from '~/shared/db'

import {
  addEntryRecord,
  addHabitRecord,
  deleteEntryRecord,
  deleteHabitRecord,
  loadHabitData,
  updateHabitRecord,
} from './service'
import { getEntryKey, useHabitStore } from './store'

const setHydratedData = ({ habits, entries }: { habits: Habit[]; entries: Entry[] }) => {
  const habitsById: Record<string, Habit> = {}
  const entriesByHabitDay: Record<string, Entry> = {}

  for (const habit of habits) habitsById[habit.id] = habit
  for (const entry of entries) entriesByHabitDay[getEntryKey(entry.habitId, entry.day)] = entry

  useHabitStore.setState({
    hydrationStatus: 'ready',
    hydrationError: null,
    habitsById,
    habitIds: habits.map((habit) => habit.id),
    entriesByHabitDay,
  })
}

let hydrationPromise: Promise<void> | null = null
const mutationQueues = new Map<string, Promise<void>>()

export const hydrateHabitStore = (): Promise<void> => {
  const state = useHabitStore.getState()
  if (state.hydrationStatus === 'ready') return Promise.resolve()
  if (hydrationPromise) return hydrationPromise

  useHabitStore.setState({
    hydrationStatus: 'loading',
    hydrationError: null,
    habitsById: {},
    habitIds: [],
    entriesByHabitDay: {},
  })

  const loadDataPromise = loadHabitData()
    .then(setHydratedData)
    .catch((error: Error) => {
      useHabitStore.setState({ hydrationStatus: 'error', hydrationError: error })
    })

  hydrationPromise = loadDataPromise
  loadDataPromise.then(
    () => {
      if (hydrationPromise === loadDataPromise) hydrationPromise = null
    },
    () => {
      if (hydrationPromise === loadDataPromise) hydrationPromise = null
    },
  )

  return loadDataPromise
}

const runWhenReady = <T>(operation: () => Promise<T>): Promise<T> => {
  if (useHabitStore.getState().hydrationStatus !== 'ready')
    return hydrateHabitStore().then(operation)

  try {
    return operation()
  } catch (error) {
    return Promise.reject(error)
  }
}

const enqueueForHabit = <T>(habitId: string, operation: () => Promise<T>): Promise<T> => {
  const previous = mutationQueues.get(habitId) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(operation)
  const tail = current.then(
    () => undefined,
    () => undefined,
  )

  mutationQueues.set(habitId, tail)
  tail.then(() => {
    if (mutationQueues.get(habitId) === tail) mutationQueues.delete(habitId)
  })

  return current
}

const removeHabitFromState = (habitId: string) => {
  const state = useHabitStore.getState()
  const habitsById = { ...state.habitsById }
  delete habitsById[habitId]

  const entriesByHabitDay = { ...state.entriesByHabitDay }
  for (const [key, entry] of Object.entries(entriesByHabitDay)) {
    if (entry.habitId === habitId) delete entriesByHabitDay[key]
  }

  useHabitStore.setState({
    habitsById,
    habitIds: state.habitIds.filter((id) => id !== habitId),
    entriesByHabitDay,
  })
}

export const addHabit = ({
  name,
  description,
  schedule,
}: {
  name: string
  description?: string
  schedule: Schedule
}): Promise<Habit> =>
  runWhenReady(async () => {
    const now = new Date()

    const habit: Habit = {
      id: uuidv7(),
      name: name.trim(),
      description: description?.trim() ?? '',
      schedule,
      createdAt: now,
      updatedAt: now,
    }

    const state = useHabitStore.getState()
    useHabitStore.setState({
      habitsById: { ...state.habitsById, [habit.id]: habit },
      habitIds: [...state.habitIds, habit.id],
    })

    return enqueueForHabit(habit.id, async () => {
      try {
        await addHabitRecord(habit)
        return habit
      } catch (error) {
        const current = useHabitStore.getState().habitsById[habit.id]
        if (current?.createdAt.getTime() === habit.createdAt.getTime())
          removeHabitFromState(habit.id)
        throw error
      }
    })
  })

export const editHabit = ({
  id,
  name,
  description,
  schedule,
}: {
  id: string
  name?: string
  description?: string
  schedule?: Schedule
}): Promise<Habit> =>
  runWhenReady(async () => {
    const state = useHabitStore.getState()
    const existing = state.habitsById[id]
    if (!existing) throw new EntityNotFoundError('Habit', id)

    const updated: Habit = {
      ...existing,
      name: name === undefined ? existing.name : name.trim(),
      description: description === undefined ? existing.description : description.trim(),
      schedule: schedule ?? existing.schedule,
      updatedAt: new Date(),
    }

    useHabitStore.setState({ habitsById: { ...state.habitsById, [id]: updated } })

    return enqueueForHabit(id, async () => {
      try {
        await updateHabitRecord(updated)
        return updated
      } catch (error) {
        const current = useHabitStore.getState().habitsById[id]
        if (current === updated)
          useHabitStore.setState({
            habitsById: { ...useHabitStore.getState().habitsById, [id]: existing },
          })
        throw error
      }
    })
  })

export const toggleDay = ({ habitId, day }: { habitId: string; day: Date }): Promise<void> =>
  runWhenReady(async () => {
    const state = useHabitStore.getState()
    if (!state.habitsById[habitId]) throw new EntityNotFoundError('Habit', habitId)

    const key = getEntryKey(habitId, day)
    const existing = state.entriesByHabitDay[key]

    if (existing) {
      const entriesByHabitDay = { ...state.entriesByHabitDay }
      delete entriesByHabitDay[key]
      useHabitStore.setState({ entriesByHabitDay })

      return enqueueForHabit(habitId, async () => {
        try {
          await deleteEntryRecord({ habitId, day })
        } catch (error) {
          const current = useHabitStore.getState().entriesByHabitDay[key]
          if (!current)
            useHabitStore.setState({
              entriesByHabitDay: { ...useHabitStore.getState().entriesByHabitDay, [key]: existing },
            })
          throw error
        }
      })
    }

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
      entriesByHabitDay: { ...state.entriesByHabitDay, [key]: entry },
    })

    return enqueueForHabit(habitId, async () => {
      try {
        await addEntryRecord(entry)
      } catch (error) {
        const current = useHabitStore.getState().entriesByHabitDay[key]
        if (current === entry) {
          const entriesByHabitDay = { ...useHabitStore.getState().entriesByHabitDay }
          delete entriesByHabitDay[key]
          useHabitStore.setState({ entriesByHabitDay })
        }
        throw error
      }
    })
  })

export const deleteHabit = (id: string): Promise<void> =>
  runWhenReady(async () => {
    const state = useHabitStore.getState()
    const existing = state.habitsById[id]
    if (!existing) throw new EntityNotFoundError('Habit', id)

    const habitIndex = state.habitIds.indexOf(id)
    const relatedEntries = Object.entries(state.entriesByHabitDay).filter(
      ([, entry]) => entry.habitId === id,
    )
    removeHabitFromState(id)

    return enqueueForHabit(id, async () => {
      try {
        await deleteHabitRecord(id)
      } catch (error) {
        const currentState = useHabitStore.getState()
        const currentHabit = currentState.habitsById[id]
        const hasRelatedEntries = Object.values(currentState.entriesByHabitDay).some(
          (entry) => entry.habitId === id,
        )

        if (!currentHabit && !hasRelatedEntries) {
          const entriesByHabitDay = { ...currentState.entriesByHabitDay }
          for (const [key, entry] of relatedEntries) entriesByHabitDay[key] = entry
          const habitsOrdered = [...currentState.habitIds]
          habitsOrdered.splice(habitIndex < 0 ? habitsOrdered.length : habitIndex, 0, id)
          useHabitStore.setState({
            habitsById: { ...currentState.habitsById, [id]: existing },
            habitIds: habitsOrdered,
            entriesByHabitDay,
          })
        }
        throw error
      }
    })
  })
