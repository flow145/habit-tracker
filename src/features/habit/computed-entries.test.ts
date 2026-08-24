import { describe, expect, it } from 'vitest'

import type { Entry, Schedule, Status } from '~/shared/db'
import { buildComputedEntries, getWindowEnd } from './computed-entries'

type TestEntry = Pick<Entry, 'day' | 'status'>

interface BuildComputedEntriesTestCase {
  start: Date
  end: Date
  schedule: Schedule
  entries: TestEntry[]
  expected: { statuses: string[]; firstDay: Date; lastDay: Date }
}

/**
 * @param [month=1] 1-12
 * @returns local date
 */
const date = (day: number, month = 1, hour = 0, minute = 0) =>
  new Date(2026, month - 1, day, hour, minute)

export const entry = (day: Date, status: Status = 'complete'): TestEntry => ({
  day,
  status,
})

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
    'returns the inclusive window end (%$)',
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

describe('buildComputedEntries', () => {
  it('returns an empty list when end is before start', () => {
    expect(
      buildComputedEntries({
        start: date(3),
        end: date(2),
        entries: [],
        schedule: { frequency: 1, interval: 1, intervalUnit: 'days' },
      }),
    ).toEqual([])
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: date(1),
      end: date(1),
      schedule: { frequency: 1, interval: 2, intervalUnit: 'days' },
      entries: [],
      expected: { statuses: ['incomplete'], firstDay: date(1), lastDay: date(1) },
    },
    {
      start: date(1),
      end: date(7),
      schedule: { frequency: 1, interval: 2, intervalUnit: 'weeks' },
      entries: [],
      expected: {
        statuses: Array(7).fill('incomplete'),
        firstDay: date(1),
        lastDay: date(7),
      },
    },
    {
      start: date(1),
      end: date(31),
      schedule: { frequency: 1, interval: 2, intervalUnit: 'months' },
      entries: [],
      expected: {
        statuses: Array(31).fill('incomplete'),
        firstDay: date(1),
        lastDay: date(31),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: { frequency: 1, interval: 1, intervalUnit: 'weeks' },
      entries: [],
      expected: {
        statuses: Array(3).fill('incomplete'),
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: { frequency: 1, interval: 4, intervalUnit: 'days' },
      entries: [entry(date(2))],
      expected: {
        statuses: ['incomplete', 'complete', 'not-required'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: { frequency: 2, interval: 4, intervalUnit: 'days' },
      entries: [entry(date(2))],
      expected: {
        statuses: ['incomplete', 'complete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
  ])('returns expected statuses for a range smaller than the interval (%$)', ({
    start,
    end,
    schedule,
    entries,
    expected,
  }) => {
    const computedEntries = buildComputedEntries({ start, end, entries, schedule })

    expect(computedEntries.map(({ status }) => status)).toEqual(expected.statuses)
    expect(computedEntries[0]?.day).toEqual(expected.firstDay)
    expect(computedEntries.at(-1)?.day).toEqual(expected.lastDay)
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: date(1),
      end: date(3),
      schedule: { frequency: 1, interval: 3, intervalUnit: 'days' },
      entries: [],
      expected: {
        statuses: Array(3).fill('incomplete'),
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: { frequency: 1, interval: 3, intervalUnit: 'days' },
      entries: [entry(date(2))],
      expected: {
        statuses: ['incomplete', 'complete', 'not-required'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: { frequency: 2, interval: 3, intervalUnit: 'days' },
      entries: [entry(date(2))],
      expected: {
        statuses: ['incomplete', 'complete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: { frequency: 1, interval: 3, intervalUnit: 'days' },
      entries: [entry(date(2)), entry(date(3))],
      expected: {
        statuses: ['incomplete', 'complete', 'complete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
  ])('returns expected statuses for a range equal to the interval (%$)', ({
    start,
    end,
    schedule,
    entries,
    expected,
  }) => {
    const computedEntries = buildComputedEntries({ start, end, entries, schedule })

    expect(computedEntries.map(({ status }) => status)).toEqual(expected.statuses)
    expect(computedEntries[0]?.day).toEqual(expected.firstDay)
    expect(computedEntries.at(-1)?.day).toEqual(expected.lastDay)
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: date(1),
      end: date(4),
      schedule: { frequency: 1, interval: 3, intervalUnit: 'days' },
      entries: [entry(date(1))],
      expected: {
        statuses: ['complete', 'not-required', 'not-required', 'incomplete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: { frequency: 1, interval: 3, intervalUnit: 'days' },
      entries: [entry(date(3))],
      expected: {
        statuses: ['incomplete', 'incomplete', 'complete', 'not-required'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(5),
      schedule: { frequency: 2, interval: 3, intervalUnit: 'days' },
      entries: [entry(date(1)), entry(date(3))],
      expected: {
        statuses: ['complete', 'not-required', 'complete', 'incomplete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(5),
      },
    },
  ])('returns expected statuses for a range longer than the interval (%$)', ({
    start,
    end,
    schedule,
    entries,
    expected,
  }) => {
    const computedEntries = buildComputedEntries({ start, end, entries, schedule })

    expect(computedEntries.map(({ status }) => status)).toEqual(expected.statuses)
    expect(computedEntries[0]?.day).toEqual(expected.firstDay)
    expect(computedEntries.at(-1)?.day).toEqual(expected.lastDay)
  })

  it('ignores entries outside the range', () => {
    const computedEntries = buildComputedEntries({
      start: date(2),
      end: date(4),
      entries: [entry(date(1)), entry(date(5))],
      schedule: { frequency: 1, interval: 3, intervalUnit: 'days' },
    })

    expect(computedEntries.map(({ status }) => status)).toEqual(Array(3).fill('incomplete'))
  })
})
