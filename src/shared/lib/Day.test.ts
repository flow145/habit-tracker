import { afterEach, describe, expect, it, vi } from 'vitest'

import { Day } from './Day'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('Day', () => {
  it('uses the current local calendar date when constructed without an argument', () => {
    vi.setSystemTime(new Date('2026-01-01T02:00:00Z'))
    expect(String(new Day())).toBe('2025-12-31')
  })

  it('keeps a stored date and its calendar arithmetic stable across time zones', () => {
    const value = '2026-03-08'
    vi.stubEnv('TZ', 'America/New_York')
    const inNewYork = String(new Day(value).add({ days: 1 }))
    vi.stubEnv('TZ', 'Pacific/Kiritimati')
    const inKiritimati = String(new Day(value).add({ days: 1 }))

    expect(inNewYork).toBe('2026-03-09')
    expect(inKiritimati).toBe(inNewYork)
  })

  it('keeps a calendar date even when the current zone skipped that local date', () => {
    vi.stubEnv('TZ', 'Pacific/Apia')

    const skipped = new Day('2011-12-30')
    expect(skipped.format('MMMM d')).toBe('December 30')
    expect(String(skipped.add({ days: 1 }))).toBe('2011-12-31')
    expect(Day.eachDayOfInterval(new Day('2011-12-29'), new Day('2011-12-31')).map(String)).toEqual(
      ['2011-12-29', '2011-12-30', '2011-12-31'],
    )
  })

  it('compares calendar dates directly, including equal dates and year boundaries', () => {
    const lastDay = new Day('2025-12-31')
    const sameDay = new Day('2025-12-31')
    const nextDay = new Day('2026-01-01')

    expect(lastDay < nextDay).toBe(true)
    expect(lastDay <= sameDay).toBe(true)
    expect(nextDay > lastDay).toBe(true)
    expect(nextDay >= sameDay).toBe(true)
    expect(nextDay <= lastDay).toBe(false)
    expect(String(lastDay)).toBe('2025-12-31')
  })

  it('rejects invalid or noncanonical dates', () => {
    expect(() => new Day('2026-02-30')).toThrow(RangeError)
    expect(() => new Day('2026-1-01')).toThrow(RangeError)
  })
})
