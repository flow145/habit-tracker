import { subDays } from 'date-fns'

export const MAX_DAYS = 10

export const getDateRange = () => ({ start: subDays(new Date(), MAX_DAYS - 1) })
