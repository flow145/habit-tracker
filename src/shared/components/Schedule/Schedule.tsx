import type { Field } from '@base-ui/react/field'
import { Fieldset } from '@base-ui/react/fieldset'
import { clsx } from 'clsx'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NumberField } from '~/shared/components/NumberField'
import { Select, type SelectItem } from '~/shared/components/Select'
import type { IntervalUnit, Schedule as ScheduleValue } from '~/shared/db'

import styles from './Schedule.module.css'

const DAYS_IN_WEEK = 7
// TODO Validation treats one month as 31 days (see docs/business_rules.md). Actual month-unit
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

export const Schedule = ({
  defaultValue = DEFAULT_SCHEDULE,
  disabled,
  className,
}: ScheduleProps) => {
  const { t } = useTranslation()
  const [state, setState] = useState<ScheduleState>(defaultValue)
  const frequencyActionsRef = useRef<Field.Root.Actions | null>(null)
  const [errorsContainer, setErrorsContainer] = useState<HTMLDivElement | null>(null)

  const intervalCount = state.interval ?? 1
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

  const validateFrequency = (value: unknown): string | null => {
    const frequency = value as number | null
    const { interval } = state

    if (frequency === null || !Number.isInteger(frequency) || frequency < 1)
      return t('Schedule.errors.invalidNumberOfTimes')

    if (interval !== null) {
      const max = toIntervalDays(interval, state.intervalUnit)
      if (frequency > max) return t('Schedule.errors.frequencyOverInterval', { max })
    }

    return null
  }

  const validateInterval = (value: unknown): string | null => {
    const interval = value as number | null

    if (interval === null || !Number.isInteger(interval) || interval < 1)
      return t('Schedule.errors.invalidInterval')

    return null
  }

  const handleFrequencyChange = (value: number | null) => {
    setState((prev) => ({ ...prev, frequency: value }))
  }

  const handleIntervalChange = (value: number | null) => {
    setState((prev) => ({ ...prev, interval: value }))
  }

  const handleUnitChange = (item: SelectItem | null) => {
    if (item === null) return
    setState((prev) => ({ ...prev, intervalUnit: item.value as IntervalUnit }))
  }

  return (
    <Fieldset.Root disabled={disabled} className={clsx(styles.root, className)}>
      <Fieldset.Legend className={clsx(styles.legend, 'label')}>
        {t('Schedule.legend')}
      </Fieldset.Legend>
      <div className={styles.row}>
        <NumberField
          actionsRef={frequencyActionsRef}
          defaultValue={defaultValue.frequency}
          errorContainer={errorsContainer}
          hideLabel
          label={t('Schedule.labels.frequency')}
          name='frequency'
          validate={validateFrequency}
          onValueChange={handleFrequencyChange}
        />
        <span className={clsx(styles.timesIn, 'body')} aria-hidden='true'>
          {t('Schedule.timesIn')}
        </span>
        <NumberField
          defaultValue={defaultValue.interval}
          errorContainer={errorsContainer}
          hideLabel
          label={t('Schedule.labels.interval')}
          name='interval'
          validate={validateInterval}
          onValueChange={handleIntervalChange}
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
      <div className={styles.errors} ref={setErrorsContainer} />
    </Fieldset.Root>
  )
}
