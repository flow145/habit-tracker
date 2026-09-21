export const isErrorNamed = (error: unknown, name: string) => {
  if (typeof error !== 'object' || error === null) return false
  return 'name' in error && error.name === name
}

export const toError = (value: unknown): Error =>
  value instanceof Error
    ? value
    : new Error('Non-Error value was thrown, see cause', { cause: value })
