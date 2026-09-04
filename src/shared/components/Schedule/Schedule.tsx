import { Fieldset } from '@base-ui/react/fieldset'
import { clsx } from 'clsx'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NumberField } from '~/shared/components/NumberField'
import { Select, type SelectItem } from '~/shared/components/Select'
import type { IntervalUnit, Schedule as ScheduleValue } from '~/shared/db'

import styles from './Schedule.module.css'

const DAYS_IN_WEEK = 7
// TODO One month is treated as 31 days (see docs/business_rules.md). Actual month-unit
// windows can be shorter (28–31 days), so very high frequencies may be unreachable in
// practice until buildComputedEntries caps the requirement at the window length.
const DAYS_IN_MONTH = 31

export const DEFAULT_SCHEDULE: ScheduleValue = {
  frequency: 1,
  interval: 1,
  intervalUnit: 'days',
}

export interface ScheduleProps {
  defaultValue?: ScheduleValue
  disabled?: boolean
  className?: string
}

interface ScheduleState {
  frequency: number | null
  interval: number | null
  intervalUnit: IntervalUnit
}

const toIntervalDays = (interval: number, intervalUnit: IntervalUnit): number => {
  if (intervalUnit === 'months') return interval * DAYS_IN_MONTH
  if (intervalUnit === 'weeks') return interval * DAYS_IN_WEEK
  return interval
}

const toInteger = (value: number | null): number | null =>
  value === null ? null : Math.trunc(value)

export const Schedule = ({
  defaultValue = DEFAULT_SCHEDULE,
  disabled,
  className,
}: ScheduleProps) => {
  const { t } = useTranslation()
  const [state, setState] = useState<ScheduleState>(defaultValue)

  const intervalCount = state.interval ?? 1
  const frequencyMax = toIntervalDays(intervalCount, state.intervalUnit)

  const unitItemsByValue: Record<IntervalUnit, SelectItem> = {
    days: { value: 'days', label: t('Schedule.intervalUnits.days', { count: intervalCount }) },
    weeks: {
      value: 'weeks',
      label: t('Schedule.intervalUnits.weeks', { count: intervalCount }),
    },
    months: {
      value: 'months',
      label: t('Schedule.intervalUnits.months', { count: intervalCount }),
    },
  }
  const unitItems = Object.values(unitItemsByValue)

  const clampFrequency = (
    frequency: number | null,
    interval: number,
    intervalUnit: IntervalUnit,
  ): number | null =>
    frequency === null ? null : Math.min(frequency, toIntervalDays(interval, intervalUnit))

  const handleFrequencyChange = (value: number | null) => {
    setState((prev) => ({ ...prev, frequency: toInteger(value) }))
  }

  const handleFrequencyCommit = (value: number | null) => {
    setState((prev) => ({
      ...prev,
      // Re-seed a cleared field to the min (1); the max is always >= 1.
      frequency: clampFrequency(toInteger(value) ?? 1, prev.interval ?? 1, prev.intervalUnit),
    }))
  }

  const handleIntervalChange = (value: number | null) => {
    setState((prev) => ({ ...prev, interval: toInteger(value) }))
  }

  const handleIntervalCommit = (value: number | null) => {
    setState((prev) => {
      const interval = toInteger(value) ?? 1
      return {
        ...prev,
        interval,
        frequency: clampFrequency(prev.frequency, interval, prev.intervalUnit),
      }
    })
  }

  const handleUnitChange = (item: SelectItem | null) => {
    if (item === null) return
    const intervalUnit = item.value as IntervalUnit
    setState((prev) => ({
      ...prev,
      intervalUnit,
      frequency: clampFrequency(prev.frequency, prev.interval ?? 1, intervalUnit),
    }))
  }

  return (
    <Fieldset.Root disabled={disabled} className={clsx(styles.root, className)}>
      <Fieldset.Legend className={clsx(styles.legend, 'label')}>
        {t('Schedule.legend')}
      </Fieldset.Legend>
      <div className={styles.row}>
        <NumberField
          hideLabel
          label={t('Schedule.labels.frequency')}
          max={frequencyMax}
          min={1}
          name='frequency'
          value={state.frequency}
          onValueChange={handleFrequencyChange}
          onValueCommitted={handleFrequencyCommit}
        />
        <span className={clsx(styles.timesIn, 'body')} aria-hidden='true'>
          {t('Schedule.timesIn')}
        </span>
        <NumberField
          hideLabel
          label={t('Schedule.labels.interval')}
          min={1}
          name='interval'
          value={state.interval}
          onValueChange={handleIntervalChange}
          onValueCommitted={handleIntervalCommit}
        />
        <Select
          hideLabel
          items={unitItems}
          label={t('Schedule.labels.intervalUnit')}
          name='intervalUnit'
          value={unitItemsByValue[state.intervalUnit]}
          onValueChange={handleUnitChange}
        />
      </div>
    </Fieldset.Root>
  )
}
