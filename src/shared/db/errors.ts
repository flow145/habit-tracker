type Entity = 'Habit' | 'Completion'

export class EntityNotFoundError extends Error {
  constructor(entity: Entity, id: string, options?: ErrorOptions) {
    super(`${entity} ${id} does not exist`, options)
    this.name = 'EntityNotFoundError'
  }
}

export class EntityConflictError extends Error {
  constructor(entity: Entity, keys: Record<string, unknown>, options?: ErrorOptions) {
    const keysStr = Object.entries(keys)
      .map(([key, value]) => `${key}:${value}`)
      .join(', ')
    super(`${entity} with ${keysStr} already exists`, options)
    this.name = 'EntityConflictError'
  }
}
