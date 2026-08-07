import { format } from 'date-fns'

export const toISODate = (date: Date) => format(date, 'yyyy-MM-dd')
