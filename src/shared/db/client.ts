import { type IDBPDatabase, openDB } from 'idb'

import type { DBSchema } from './schema'

export const DB_VERSION = 1

let database: Promise<IDBPDatabase<DBSchema>> | null = null

export const getDb = () => {
  if (database) return database

  const opening = openDB<DBSchema>(import.meta.env.VITE_DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 1) {
        const habitStore = db.objectStoreNames.contains('habits')
          ? tx.objectStore('habits')
          : db.createObjectStore('habits', { keyPath: 'id' })

        if (!habitStore.indexNames.contains('byCreatedAt'))
          habitStore.createIndex('byCreatedAt', 'createdAt')

        const completionStore = db.objectStoreNames.contains('completions')
          ? tx.objectStore('completions')
          : db.createObjectStore('completions', { keyPath: 'id' })

        if (!completionStore.indexNames.contains('byHabitAndDate'))
          completionStore.createIndex('byHabitAndDate', ['habitId', 'date'], { unique: true })
      }
    },

    blocked() {
      // TODO use app level notifications
      alert('Update pending, please close all the other Habit Tracker tabs')
    },

    async blocking() {
      const db = await opening
      db.close()
      if (database === opening) database = null
    },

    terminated() {
      if (database === opening) database = null
    },
  })

  database = opening

  opening.catch(() => {
    if (database === opening) database = null
  })

  return opening
}

export const closeDb = async () => {
  if (!database) return

  const opening = database

  try {
    const db = await opening
    db.close()
  } finally {
    if (database === opening) database = null
  }
}
