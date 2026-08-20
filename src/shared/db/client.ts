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

        const entryStore = db.objectStoreNames.contains('entries')
          ? tx.objectStore('entries')
          : db.createObjectStore('entries', { keyPath: 'id' })

        if (!entryStore.indexNames.contains('byHabitAndDay'))
          entryStore.createIndex('byHabitAndDay', ['habitId', 'day'], { unique: true })
        if (!entryStore.indexNames.contains('byDay')) entryStore.createIndex('byDay', 'day')
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
