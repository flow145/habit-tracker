type Entity = 'Habit' | 'Entry'

export class EntityNotFoundError extends Error {
  constructor(entity: Entity, id: string, options?: ErrorOptions) {
    super(`${entity} ${id} does not exist`, options)
    this.name = 'EntityNotFoundError'
  }
}

export class EntityConflictError extends Error {
  constructor(entity: Entity, id: string, options?: ErrorOptions) {
    super(`${entity} ${id} conflicts with existing data`, options)
    this.name = 'EntityConflictError'
  }
}
