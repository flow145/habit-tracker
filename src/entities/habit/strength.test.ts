import { describe, expect, it } from 'vitest'

import type { Schedule } from '~/shared/api'
import { day } from '~/shared/tests'
import type { ComputedEntry, ComputedStatus } from './computed-entries'
import { calculateStrength } from './strength'

const everyDay: Schedule = { frequency: 1, interval: 1, intervalUnit: 'days' }
const twoIn3Days: Schedule = { frequency: 2, interval: 3, intervalUnit: 'days' }
const everyMonth: Schedule = { frequency: 1, interval: 1, intervalUnit: 'months' }
const computedEntries = (...statuses: ComputedStatus[]): ComputedEntry[] =>
  statuses.map((status, index) => ({ day: day(1).add({ days: index }), status }))

describe('calculateStrength', () => {
  it('returns one result per day and starts at zero', () => {
    expect(calculateStrength([], everyDay)).toEqual([])
    expect(calculateStrength(computedEntries('incomplete', 'not-required'), everyDay)).toEqual([
      0, 0,
    ])
  })

  it('grows with diminishing returns and leaves not-required days neutral', () => {
    const strengths = calculateStrength(
      computedEntries('complete', 'not-required', 'complete'),
      everyDay,
    )
    expect(strengths).toEqual([0.05, 0.05, 0.0975])
  })

  it('applies resistance-weighted decay and resumes growth from the decayed strength', () => {
    const strengths = calculateStrength(
      computedEntries('complete', 'incomplete', 'complete'),
      everyDay,
    )
    expect(strengths[1]).toBeCloseTo(0.04666625, 12)
    expect(strengths[2]).toBeCloseTo(0.0943329375, 12)
  })

  it.each<{ schedule: Schedule; expected: number }>([
    { schedule: twoIn3Days, expected: 0.0477775 },
    {
      schedule: { frequency: 3, interval: 2, intervalUnit: 'weeks' },
      expected: 0.049285625,
    },
    { schedule: everyMonth, expected: 0.05 - 0.00333375 / (365.25 / 12) },
    {
      schedule: { frequency: 31, interval: 1, intervalUnit: 'months' },
      expected: 0.05 - (0.00333375 * 31) / (365.25 / 12),
    },
  ])('normalizes decay for the schedule without capping monthly weights (%$)', ({
    schedule,
    expected,
  }) => {
    expect(calculateStrength(computedEntries('complete', 'incomplete'), schedule)[1]).toBeCloseTo(
      expected,
      12,
    )
  })

  it.each<Schedule>([
    everyDay,
    twoIn3Days,
    everyMonth,
  ])('uses fixed growth per completion regardless of schedule (%$)', (schedule) => {
    const history = computedEntries(...Array<ComputedStatus>(100).fill('complete'))
    expect(calculateStrength(history, schedule).at(-1)).toBeCloseTo(1 - 0.95 ** 100, 12)
  })

  it('keeps strength finite and bounded over long growth and decay histories', () => {
    const history = computedEntries(
      ...Array<ComputedStatus>(1000).fill('complete'),
      ...Array<ComputedStatus>(1000).fill('incomplete'),
    )
    const strengths = calculateStrength(history, {
      frequency: 31,
      interval: 1,
      intervalUnit: 'months',
    })
    expect(strengths).toHaveLength(history.length)
    expect(
      strengths.every((strength) => Number.isFinite(strength) && strength >= 0 && strength <= 1),
    ).toBe(true)
    expect(strengths.at(-1)).toBeLessThan(0.001)
  })
})
