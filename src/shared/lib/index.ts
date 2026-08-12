import { format } from 'date-fns'

export const toISODate = (date: Date) => format(date, 'yyyy-MM-dd')

export const isErrorNamed = (error: unknown, name: string) => {
  if (typeof error !== 'object' || error === null) return false
  return 'name' in error && error.name === name
}
