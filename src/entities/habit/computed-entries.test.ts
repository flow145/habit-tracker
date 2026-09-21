import { describe, expect, it, vi } from 'vitest'

import type { Entry, ExplicitStatus, Schedule } from '~/shared/api'
import { Day } from '~/shared/lib'
import { day } from '~/shared/tests'
import {
  buildComputedEntries,
  getNextStatus,
  getWindowEnd,
  getWindowStart,
} from './computed-entries'

type TestEntry = Pick<Entry, 'day' | 'status'>

interface BuildComputedEntriesTestCase {
  start: Day
  end: Day
  schedule: Schedule
  entries: TestEntry[]
  expected: { statuses: string[]; firstDay: Day; lastDay: Day }
}

const everyDay: Schedule = { frequency: 1, interval: 1, intervalUnit: 'days' }
const every3Days: Schedule = { frequency: 1, interval: 3, intervalUnit: 'days' }
const twoIn3Days: Schedule = { frequency: 2, interval: 3, intervalUnit: 'days' }
const threeIn1Week: Schedule = { frequency: 3, interval: 1, intervalUnit: 'weeks' }
const everyMonth: Schedule = { frequency: 1, interval: 1, intervalUnit: 'months' }

export const entry = (day: Day, status: ExplicitStatus = 'complete'): TestEntry => ({
  day: day.value,
  status,
})

const entriesByDay = (entries: readonly TestEntry[]) =>
  Object.fromEntries(entries.map((entry) => [entry.day, entry]))

describe('getNextStatus', () => {
  it('cycles complete to incomplete', () => {
    expect(getNextStatus('complete')).toBe('incomplete')
  })

  it('cycles every other status to complete', () => {
    expect(getNextStatus('incomplete')).toBe('complete')
    expect(getNextStatus('not-required')).toBe('complete')
  })
})

describe('getWindowEnd', () => {
  it.each`
    startDate     | interval | intervalUnit | expectedDate
    ${day(1)}     | ${1}     | ${'days'}    | ${day(1)}
    ${day(1)}     | ${2}     | ${'days'}    | ${day(2)}
    ${day(1)}     | ${7}     | ${'days'}    | ${day(7)}
    ${day(26)}    | ${1}     | ${'weeks'}   | ${day(1, 2)}
    ${day(25, 2)} | ${2}     | ${'weeks'}   | ${day(10, 3)}
    ${day(15)}    | ${1}     | ${'months'}  | ${day(14, 2)}
    ${day(15)}    | ${2}     | ${'months'}  | ${day(14, 3)}
    ${day(28)}    | ${1}     | ${'months'}  | ${day(27, 2)}
    ${day(29)}    | ${1}     | ${'months'}  | ${day(27, 2)}
    ${day(30)}    | ${1}     | ${'months'}  | ${day(27, 2)}
    ${day(31)}    | ${1}     | ${'months'}  | ${day(27, 2)}
    ${day(31)}    | ${2}     | ${'months'}  | ${day(30, 3)}
  `(
    'returns the inclusive window end (%$)',
    ({ startDate, interval, intervalUnit, expectedDate }) => {
      const schedule: Schedule = { frequency: 1, interval, intervalUnit }

      expect(getWindowEnd(startDate, schedule)).toEqual(expectedDate)
    },
  )
})

describe('getWindowStart', () => {
  it.each`
    endDate       | interval | intervalUnit | expectedDate
    ${day(1)}     | ${1}     | ${'days'}    | ${day(1)}
    ${day(2)}     | ${2}     | ${'days'}    | ${day(1)}
    ${day(7)}     | ${7}     | ${'days'}    | ${day(1)}
    ${day(1, 2)}  | ${1}     | ${'weeks'}   | ${day(26)}
    ${day(10, 3)} | ${2}     | ${'weeks'}   | ${day(25, 2)}
    ${day(14, 2)} | ${1}     | ${'months'}  | ${day(15)}
    ${day(14, 3)} | ${2}     | ${'months'}  | ${day(15)}
    ${day(27, 2)} | ${1}     | ${'months'}  | ${day(28)}
    ${day(30, 3)} | ${2}     | ${'months'}  | ${day(31)}
  `(
    'returns the inclusive window start (%$)',
    ({ endDate, interval, intervalUnit, expectedDate }) => {
      const schedule: Schedule = { frequency: 1, interval, intervalUnit }

      expect(getWindowStart(endDate, schedule)).toEqual(expectedDate)
    },
  )
})

describe('buildComputedEntries', () => {
  it('returns an empty list when end is before start', () => {
    expect(
      buildComputedEntries({
        start: day(3),
        end: day(2),
        entries: {},
        schedule: everyDay,
      }),
    ).toEqual([])
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: day(1),
      end: day(1),
      schedule: everyDay,
      entries: [],
      expected: { statuses: ['incomplete'], firstDay: day(1), lastDay: day(1) },
    },
    {
      start: day(1),
      end: day(1),
      schedule: everyDay,
      entries: [entry(day(1))],
      expected: { statuses: ['complete'], firstDay: day(1), lastDay: day(1) },
    },
    {
      start: day(1),
      end: day(3),
      schedule: everyDay,
      entries: [entry(day(1)), entry(day(3))],
      expected: {
        statuses: ['complete', 'incomplete', 'complete'],
        firstDay: day(1),
        lastDay: day(3),
      },
    },
  ])('returns expected statuses for a schedule of every day (%$)', ({
    start,
    end,
    schedule,
    entries,
    expected,
  }) => {
    const computedEntries = buildComputedEntries({
      start,
      end,
      entries: entriesByDay(entries),
      schedule,
    })

    expect(computedEntries.map(({ status }) => status)).toEqual(expected.statuses)
    expect(computedEntries[0]?.day).toEqual(expected.firstDay)
    expect(computedEntries.at(-1)?.day).toEqual(expected.lastDay)
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: day(1),
      end: day(2),
      schedule: twoIn3Days,
      entries: [],
      expected: {
        statuses: ['incomplete', 'incomplete'],
        firstDay: day(1),
        lastDay: day(2),
      },
    },
    {
      start: day(1),
      end: day(2),
      schedule: twoIn3Days,
      entries: [entry(day(1))],
      expected: { statuses: ['complete', 'incomplete'], firstDay: day(1), lastDay: day(2) },
    },
    {
      start: day(1),
      end: day(2),
      schedule: twoIn3Days,
      entries: [entry(day(2))],
      expected: { statuses: ['incomplete', 'complete'], firstDay: day(1), lastDay: day(2) },
    },
    {
      start: day(1),
      end: day(3),
      schedule: twoIn3Days,
      entries: [entry(day(1))],
      expected: {
        statuses: ['complete', 'incomplete', 'incomplete'],
        firstDay: day(1),
        lastDay: day(3),
      },
    },
    {
      start: day(1),
      end: day(3),
      schedule: twoIn3Days,
      entries: [entry(day(2))],
      expected: {
        statuses: ['incomplete', 'complete', 'incomplete'],
        firstDay: day(1),
        lastDay: day(3),
      },
    },
    {
      start: day(1),
      end: day(3),
      schedule: twoIn3Days,
      entries: [entry(day(3))],
      expected: {
        statuses: ['incomplete', 'incomplete', 'complete'],
        firstDay: day(1),
        lastDay: day(3),
      },
    },
    {
      start: day(1),
      end: day(3),
      schedule: twoIn3Days,
      entries: [entry(day(1)), entry(day(3))],
      expected: {
        statuses: ['complete', 'not-required', 'complete'],
        firstDay: day(1),
        lastDay: day(3),
      },
    },
    {
      start: day(1),
      end: day(3),
      schedule: twoIn3Days,
      entries: [entry(day(1)), entry(day(2))],
      expected: {
        statuses: ['complete', 'complete', 'not-required'],
        firstDay: day(1),
        lastDay: day(3),
      },
    },
    {
      start: day(1),
      end: day(3),
      schedule: twoIn3Days,
      entries: [entry(day(2)), entry(day(3))],
      expected: {
        statuses: ['incomplete', 'complete', 'complete'],
        firstDay: day(1),
        lastDay: day(3),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: twoIn3Days,
      entries: [entry(day(2))],
      expected: {
        statuses: ['incomplete', 'complete', 'incomplete', 'incomplete'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: twoIn3Days,
      entries: [entry(day(1)), entry(day(4))],
      expected: {
        statuses: ['complete', 'incomplete', 'incomplete', 'complete'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: twoIn3Days,
      entries: [entry(day(1)), entry(day(2))],
      expected: {
        statuses: ['complete', 'complete', 'not-required', 'incomplete'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: twoIn3Days,
      entries: [entry(day(1)), entry(day(3))],
      expected: {
        statuses: ['complete', 'not-required', 'complete', 'incomplete'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: twoIn3Days,
      entries: [entry(day(1)), entry(day(2)), entry(day(3))],
      expected: {
        statuses: ['complete', 'complete', 'complete', 'not-required'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
  ])('returns expected statuses for 2 times in 3 days (%$)', ({
    start,
    end,
    schedule,
    entries,
    expected,
  }) => {
    const computedEntries = buildComputedEntries({
      start,
      end,
      entries: entriesByDay(entries),
      schedule,
    })

    expect(computedEntries.map(({ status }) => status)).toEqual(expected.statuses)
    expect(computedEntries[0]?.day).toEqual(expected.firstDay)
    expect(computedEntries.at(-1)?.day).toEqual(expected.lastDay)
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: day(1),
      end: day(4),
      schedule: threeIn1Week,
      entries: [],
      expected: {
        statuses: Array(4).fill('incomplete'),
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: threeIn1Week,
      entries: [entry(day(1))],
      expected: {
        statuses: ['complete', 'incomplete', 'incomplete', 'incomplete'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: threeIn1Week,
      entries: [entry(day(1)), entry(day(3))],
      expected: {
        statuses: ['complete', 'incomplete', 'complete', 'incomplete'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: threeIn1Week,
      entries: [entry(day(1)), entry(day(2)), entry(day(3))],
      expected: {
        statuses: ['complete', 'complete', 'complete', 'not-required'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(4),
      schedule: threeIn1Week,
      entries: [entry(day(1)), entry(day(3)), entry(day(4))],
      expected: {
        statuses: ['complete', 'not-required', 'complete', 'complete'],
        firstDay: day(1),
        lastDay: day(4),
      },
    },
    {
      start: day(1),
      end: day(7),
      schedule: threeIn1Week,
      entries: [entry(day(1))],
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
        firstDay: day(1),
        lastDay: day(7),
      },
    },
    {
      start: day(1),
      end: day(7),
      schedule: threeIn1Week,
      entries: [entry(day(1)), entry(day(3)), entry(day(5))],
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
        firstDay: day(1),
        lastDay: day(7),
      },
    },
    {
      start: day(1),
      end: day(7),
      schedule: threeIn1Week,
      entries: [entry(day(2)), entry(day(4)), entry(day(6))],
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
        firstDay: day(1),
        lastDay: day(7),
      },
    },
    {
      start: day(1),
      end: day(10),
      schedule: threeIn1Week,
      entries: [entry(day(3)), entry(day(8)), entry(day(9))],
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
        firstDay: day(1),
        lastDay: day(10),
      },
    },
    {
      start: day(1),
      end: day(10),
      schedule: threeIn1Week,
      entries: [entry(day(1)), entry(day(3)), entry(day(5)), entry(day(8))],
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
        firstDay: day(1),
        lastDay: day(10),
      },
    },
  ])('returns expected statuses for 3 times in a week (%$)', ({
    start,
    end,
    schedule,
    entries,
    expected,
  }) => {
    const computedEntries = buildComputedEntries({
      start,
      end,
      entries: entriesByDay(entries),
      schedule,
    })

    expect(computedEntries.map(({ status }) => status)).toEqual(expected.statuses)
    expect(computedEntries[0]?.day).toEqual(expected.firstDay)
    expect(computedEntries.at(-1)?.day).toEqual(expected.lastDay)
  })

  it.each<BuildComputedEntriesTestCase>([
    {
      start: day(28),
      end: day(1, 3),
      schedule: everyMonth,
      entries: [entry(day(28))],
      expected: {
        statuses: ['complete', ...Array(30).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: day(28),
        lastDay: day(1, 3),
      },
    },
    {
      start: day(29),
      end: day(1, 3),
      schedule: everyMonth,
      entries: [entry(day(29))],
      expected: {
        statuses: ['complete', ...Array(29).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: day(29),
        lastDay: day(1, 3),
      },
    },
    {
      start: day(30),
      end: day(1, 3),
      schedule: everyMonth,
      entries: [entry(day(30))],
      expected: {
        statuses: ['complete', ...Array(28).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: day(30),
        lastDay: day(1, 3),
      },
    },
    {
      start: day(31),
      end: day(1, 3),
      schedule: everyMonth,
      entries: [entry(day(31))],
      expected: {
        statuses: ['complete', ...Array(27).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: day(31),
        lastDay: day(1, 3),
      },
    },
    {
      start: day(1, 2),
      end: day(2, 3),
      schedule: everyMonth,
      entries: [entry(day(1, 2))],
      expected: {
        statuses: ['complete', ...Array(27).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: day(1, 2),
        lastDay: day(2, 3),
      },
    },
    {
      start: day(28, 2),
      end: day(29, 3),
      schedule: everyMonth,
      entries: [entry(day(28, 2))],
      expected: {
        statuses: ['complete', ...Array(27).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: day(28, 2),
        lastDay: day(29, 3),
      },
    },
    {
      start: day(1, 3),
      end: day(2, 4),
      schedule: everyMonth,
      entries: [entry(day(1, 3))],
      expected: {
        statuses: ['complete', ...Array(30).fill('not-required'), ...Array(2).fill('incomplete')],
        firstDay: day(1, 3),
        lastDay: day(2, 4),
      },
    },
  ])('returns expected statuses for once in a month (%$)', ({
    start,
    end,
    schedule,
    entries,
    expected,
  }) => {
    const computedEntries = buildComputedEntries({
      start,
      end,
      entries: entriesByDay(entries),
      schedule,
    })

    expect(computedEntries.map(({ status }) => status)).toEqual(expected.statuses)
    expect(computedEntries[0]?.day).toEqual(expected.firstDay)
    expect(computedEntries.at(-1)?.day).toEqual(expected.lastDay)
  })

  it('derives not-required from entries before the range within the schedule margin', () => {
    const computedEntries = buildComputedEntries({
      start: day(2),
      end: day(4),
      entries: entriesByDay([entry(day(1))]),
      schedule: every3Days,
    })

    expect(computedEntries.map(({ status }) => status)).toEqual([
      'not-required',
      'not-required',
      'incomplete',
    ])
    expect(computedEntries[0]?.day).toEqual(day(2))
  })

  it('ignores entries older than the schedule margin', () => {
    const computedEntries = buildComputedEntries({
      start: day(4),
      end: day(6),
      entries: entriesByDay([entry(day(1))]),
      schedule: every3Days,
    })

    expect(computedEntries.map(({ status }) => status)).toEqual(Array(3).fill('incomplete'))
  })

  it('ignores entries after the range', () => {
    const computedEntries = buildComputedEntries({
      start: day(1),
      end: day(3),
      entries: entriesByDay([entry(day(4))]),
      schedule: every3Days,
    })

    expect(computedEntries.map(({ status }) => status)).toEqual(Array(3).fill('incomplete'))
  })

  it('keeps schedule results on the same dates after a time-zone change', () => {
    const start = new Day('2026-03-07')
    const end = new Day('2026-03-11')
    const entries = entriesByDay([entry(start), entry(new Day('2026-03-09'))])

    try {
      vi.stubEnv('TZ', 'America/New_York')
      const before = buildComputedEntries({ start, end, entries, schedule: twoIn3Days })
      vi.stubEnv('TZ', 'Asia/Tashkent')
      const after = buildComputedEntries({ start, end, entries, schedule: twoIn3Days })

      expect(after.map(({ day, status }) => [day.value, status])).toEqual(
        before.map(({ day, status }) => [day.value, status]),
      )
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
