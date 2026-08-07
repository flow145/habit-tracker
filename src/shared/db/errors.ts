export class RepositoryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'RepositoryError'
  }
}

export class RecordNotFoundError extends RepositoryError {
  constructor(entity: string, id: string, options?: ErrorOptions) {
    super(`${entity} with id ${id} does not exist`, options)
    this.name = 'RecordNotFoundError'
  }
}

export class RecordAlreadyExistsError extends RepositoryError {
  constructor(entity: string, id: string, options?: ErrorOptions) {
    super(`${entity} with id ${id} already exists`, options)
    this.name = 'RecordAlreadyExistsError'
  }
}
