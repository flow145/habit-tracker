import type { Schedule } from '~/shared/api'

import type { ComputedEntry } from './computed-entries'

const GROWTH_RATE = 0.05
const DECAY_RATE = 0.07
const MAX_DECAY_RESISTANCE = 0.95
const DAYS_PER_UNIT = { days: 1, weeks: 7, months: 365.25 / 12 }

export const calculateStrength = (
  computedEntries: readonly ComputedEntry[],
  { frequency, interval, intervalUnit }: Schedule,
): number[] => {
  let strength = 0
  const incompleteDayWeight = frequency / (interval * DAYS_PER_UNIT[intervalUnit])

  return computedEntries.map(({ status }) => {
    if (status === 'complete') strength += GROWTH_RATE * (1 - strength)

    if (status === 'incomplete') {
      const resistanceFactor = 1 - MAX_DECAY_RESISTANCE * strength
      strength *= 1 - DECAY_RATE * incompleteDayWeight * resistanceFactor
    }

    return strength
  })
}
