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

const everyDay: Schedule = { frequency: 1, interval: 1, intervalUnit: 'days' }
const twoIn3Days: Schedule = { frequency: 2, interval: 3, intervalUnit: 'days' }
const threeIn1Week: Schedule = { frequency: 3, interval: 1, intervalUnit: 'weeks' }
const everyMonth: Schedule = { frequency: 1, interval: 1, intervalUnit: 'months' }

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

    expect(getWindowEnd(start, everyDay)).toEqual(date(1, 1, 15, 30))
  })
})

describe('buildComputedEntries', () => {
  it('returns an empty list when end is before start', () => {
    expect(
      buildComputedEntries({
        start: date(3),
        end: date(2),
        entries: [],
        schedule: everyDay,
      }),
    ).toEqual([])
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: date(1),
      end: date(1),
      schedule: everyDay,
      entries: [],
      expected: { statuses: ['incomplete'], firstDay: date(1), lastDay: date(1) },
    },
    {
      start: date(1),
      end: date(1),
      schedule: everyDay,
      entries: [entry(date(1))],
      expected: { statuses: ['complete'], firstDay: date(1), lastDay: date(1) },
    },
    {
      start: date(1),
      end: date(3),
      schedule: everyDay,
      entries: [entry(date(1)), entry(date(3))],
      expected: {
        statuses: ['complete', 'incomplete', 'complete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
  ])('returns expected statuses for a schedule of every day (%$)', ({
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
      end: date(2),
      schedule: twoIn3Days,
      entries: [],
      expected: {
        statuses: ['incomplete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(2),
      },
    },
    {
      start: date(1),
      end: date(2),
      schedule: twoIn3Days,
      entries: [entry(date(1))],
      expected: { statuses: ['complete', 'incomplete'], firstDay: date(1), lastDay: date(2) },
    },
    {
      start: date(1),
      end: date(2),
      schedule: twoIn3Days,
      entries: [entry(date(2))],
      expected: { statuses: ['incomplete', 'complete'], firstDay: date(1), lastDay: date(2) },
    },
    {
      start: date(1),
      end: date(3),
      schedule: twoIn3Days,
      entries: [entry(date(1))],
      expected: {
        statuses: ['complete', 'incomplete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: twoIn3Days,
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
      schedule: twoIn3Days,
      entries: [entry(date(3))],
      expected: {
        statuses: ['incomplete', 'incomplete', 'complete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: twoIn3Days,
      entries: [entry(date(1)), entry(date(3))],
      expected: {
        statuses: ['complete', 'not-required', 'complete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: twoIn3Days,
      entries: [entry(date(1)), entry(date(2))],
      expected: {
        statuses: ['complete', 'complete', 'not-required'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(3),
      schedule: twoIn3Days,
      entries: [entry(date(2)), entry(date(3))],
      expected: {
        statuses: ['incomplete', 'complete', 'complete'],
        firstDay: date(1),
        lastDay: date(3),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: twoIn3Days,
      entries: [entry(date(2))],
      expected: {
        statuses: ['incomplete', 'complete', 'incomplete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: twoIn3Days,
      entries: [entry(date(1)), entry(date(4))],
      expected: {
        statuses: ['complete', 'incomplete', 'incomplete', 'complete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: twoIn3Days,
      entries: [entry(date(1)), entry(date(2))],
      expected: {
        statuses: ['complete', 'complete', 'not-required', 'incomplete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: twoIn3Days,
      entries: [entry(date(1)), entry(date(3))],
      expected: {
        statuses: ['complete', 'not-required', 'complete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: twoIn3Days,
      entries: [entry(date(1)), entry(date(2)), entry(date(3))],
      expected: {
        statuses: ['complete', 'complete', 'complete', 'not-required'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
  ])('returns expected statuses for 2 times in 3 days (%$)', ({
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
      schedule: threeIn1Week,
      entries: [],
      expected: {
        statuses: Array(4).fill('incomplete'),
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: threeIn1Week,
      entries: [entry(date(1))],
      expected: {
        statuses: ['complete', 'incomplete', 'incomplete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: threeIn1Week,
      entries: [entry(date(1)), entry(date(3))],
      expected: {
        statuses: ['complete', 'incomplete', 'complete', 'incomplete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: threeIn1Week,
      entries: [entry(date(1)), entry(date(2)), entry(date(3))],
      expected: {
        statuses: ['complete', 'complete', 'complete', 'not-required'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(4),
      schedule: threeIn1Week,
      entries: [entry(date(1)), entry(date(3)), entry(date(4))],
      expected: {
        statuses: ['complete', 'not-required', 'complete', 'complete'],
        firstDay: date(1),
        lastDay: date(4),
      },
    },
    {
      start: date(1),
      end: date(7),
      schedule: threeIn1Week,
      entries: [entry(date(1))],
      expected: {
        statuses: [
          'complete',
          'incomplete',
          'incomplete',
          'incomplete',
          'incomplete',
          'incomplete',
          'incomplete',
        ],
        firstDay: date(1),
        lastDay: date(7),
      },
    },
    {
      start: date(1),
      end: date(7),
      schedule: threeIn1Week,
      entries: [entry(date(1)), entry(date(3)), entry(date(5))],
      expected: {
        statuses: [
          'complete',
          'not-required',
          'complete',
          'not-required',
          'complete',
          'not-required',
          'not-required',
        ],
        firstDay: date(1),
        lastDay: date(7),
      },
    },
    {
      start: date(1),
      end: date(7),
      schedule: threeIn1Week,
      entries: [entry(date(2)), entry(date(4)), entry(date(6))],
      expected: {
        statuses: [
          'incomplete',
          'complete',
          'not-required',
          'complete',
          'not-required',
          'complete',
          'not-required',
        ],
        firstDay: date(1),
        lastDay: date(7),
      },
    },
    {
      start: date(1),
      end: date(10),
      schedule: threeIn1Week,
      entries: [entry(date(3)), entry(date(8)), entry(date(9))],
      expected: {
        statuses: [
          'incomplete',
          'incomplete',
          'complete',
          'not-required',
          'not-required',
          'not-required',
          'not-required',
          'complete',
          'complete',
          'incomplete',
        ],
        firstDay: date(1),
        lastDay: date(10),
      },
    },
    {
      start: date(1),
      end: date(10),
      schedule: threeIn1Week,
      entries: [entry(date(1)), entry(date(3)), entry(date(5)), entry(date(8))],
      expected: {
        statuses: [
          'complete',
          'not-required',
          'complete',
          'not-required',
          'complete',
          'not-required',
          'not-required',
          'complete',
          'not-required',
          'incomplete',
        ],
        firstDay: date(1),
        lastDay: date(10),
      },
    },
  ])('returns expected statuses for 3 times in a week (%$)', ({
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
      start: date(28),
      end: date(1, 3),
      schedule: everyMonth,
      entries: [entry(date(28))],
      expected: {
        statuses: ['complete', ...Array(30).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: date(28),
        lastDay: date(1, 3),
      },
    },
    {
      start: date(29),
      end: date(1, 3),
      schedule: everyMonth,
      entries: [entry(date(29))],
      expected: {
        statuses: ['complete', ...Array(29).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: date(29),
        lastDay: date(1, 3),
      },
    },
    {
      start: date(30),
      end: date(1, 3),
      schedule: everyMonth,
      entries: [entry(date(30))],
      expected: {
        statuses: ['complete', ...Array(28).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: date(30),
        lastDay: date(1, 3),
      },
    },
    {
      start: date(31),
      end: date(1, 3),
      schedule: everyMonth,
      entries: [entry(date(31))],
      expected: {
        statuses: ['complete', ...Array(27).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: date(31),
        lastDay: date(1, 3),
      },
    },
    {
      start: date(1, 2),
      end: date(2, 3),
      schedule: everyMonth,
      entries: [entry(date(1, 2))],
      expected: {
        statuses: ['complete', ...Array(27).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: date(1, 2),
        lastDay: date(2, 3),
      },
    },
    {
      start: date(28, 2),
      end: date(29, 3),
      schedule: everyMonth,
      entries: [entry(date(28, 2))],
      expected: {
        statuses: ['complete', ...Array(27).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: date(28, 2),
        lastDay: date(29, 3),
      },
    },
    {
      start: date(1, 3),
      end: date(2, 4),
      schedule: everyMonth,
      entries: [entry(date(1, 3))],
      expected: {
        statuses: ['complete', ...Array(30).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: date(1, 3),
        lastDay: date(2, 4),
      },
    },
  ])('returns expected statuses for once in a month (%$)', ({
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
