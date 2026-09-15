export const isErrorNamed = (error: unknown, name: string) => {
  if (typeof error !== 'object' || error === null) return false
  return 'name' in error && error.name === name
}

export const groupBy = <T, K>(items: T[], getKey: (item: T) => K): Map<K, T[]> => {
  const groups = new Map<K, T[]>()

  for (const item of items) {
    const key = getKey(item)
    const group = groups.get(key)

    if (group) group.push(item)
    else groups.set(key, [item])
  }

  return groups
}

export const toError = (value: unknown): Error =>
  value instanceof Error
    ? value
    : new Error('Non-Error value was thrown, see cause', { cause: value })
