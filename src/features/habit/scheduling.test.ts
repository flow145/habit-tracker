import { describe, expect, it } from 'vitest'

import type { Completion, CompletionStatus, Schedule } from '~/shared/db'
import { getWindowEnd, isSameDayOrBefore } from './scheduling'

/**
 * @param [month=1] 1-12
 * @returns local date
 */
const date = (day: number, month = 1, hour = 0, minute = 0) =>
  new Date(2026, month - 1, day, hour, minute)

export const completion = (
  day: Date,
  status: CompletionStatus = 'complete',
): Pick<Completion, 'day' | 'status'> => ({ day, status })

describe('getWindowEnd', () => {
  it.each`
    startDate      | interval | intervalUnit | expectedDate
    ${date(1)}     | ${1}     | ${'days'}    | ${date(1)}
    ${date(1)}     | ${2}     | ${'days'}    | ${date(2)}
    ${date(1)}     | ${7}     | ${'days'}    | ${date(7)}
    ${date(26)}    | ${1}     | ${'weeks'}   | ${date(1, 2)}
    ${date(25, 2)} | ${2}     | ${'weeks'}   | ${date(10, 3)}
    ${date(15)}    | ${1}     | ${'months'}  | ${date(14, 2)}
    ${date(15)}    | ${2}     | ${'months'}  | ${date(14, 3)}
    ${date(28)}    | ${1}     | ${'months'}  | ${date(27, 2)}
    ${date(29)}    | ${1}     | ${'months'}  | ${date(27, 2)}
    ${date(30)}    | ${1}     | ${'months'}  | ${date(27, 2)}
    ${date(31)}    | ${1}     | ${'months'}  | ${date(27, 2)}
    ${date(31)}    | ${2}     | ${'months'}  | ${date(30, 3)}
  `(
    'case $# returns the inclusive window end',
    ({ startDate, interval, intervalUnit, expectedDate }) => {
      const schedule: Schedule = { frequency: 1, interval, intervalUnit }

      expect(getWindowEnd(startDate, schedule)).toEqual(expectedDate)
    },
  )

  it('preserves the time of day', () => {
    const start = date(1, 1, 15, 30)
    const schedule: Schedule = { frequency: 1, interval: 1, intervalUnit: 'days' }

    expect(getWindowEnd(start, schedule)).toEqual(date(1, 1, 15, 30))
  })
})

describe('isSameDayOrBefore', () => {
  it.each`
    date              | dateToCompare     | expected
    ${date(1, 1, 9)}  | ${date(1, 1, 17)} | ${true}
    ${date(1, 1, 17)} | ${date(1, 1, 9)}  | ${true}
    ${date(1)}        | ${date(2)}        | ${true}
    ${date(2)}        | ${date(1)}        | ${false}
  `('case $# returns the expected comparison result', ({ date, dateToCompare, expected }) => {
    expect(isSameDayOrBefore(date, dateToCompare)).toBe(expected)
  })
})
