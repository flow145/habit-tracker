import type { Schedule } from '~/shared/db'

export enum Path {
  Home = '/',
  AddHabit = '/add',
  EditHabit = '/edit',
}

export const DEFAULT_SCHEDULE: Schedule = {
  frequency: 1,
  interval: 1,
  intervalUnit: 'days',
}
