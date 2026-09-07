import '~/app/i18n'

import { Form } from '@base-ui/react/form'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_SCHEDULE } from '~/shared/constants'
import type { Schedule as ScheduleValue } from '~/shared/db'
import { render, screen } from '~/shared/tests'
import { Schedule } from './Schedule'

type User = ReturnType<typeof render>['user']

const ScheduleHarness = () => {
  const [value, setValue] = useState<ScheduleValue>(DEFAULT_SCHEDULE)
  return <Schedule value={value} onValueChange={setValue} />
}

interface ScheduleFormHarnessProps {
  onSubmit?: () => void
}

const ScheduleFormHarness = ({ onSubmit = vi.fn() }: ScheduleFormHarnessProps) => {
  const [value, setValue] = useState<ScheduleValue>(DEFAULT_SCHEDULE)

  return (
    <Form onFormSubmit={onSubmit}>
      <Schedule value={value} onValueChange={setValue} />
      <button type='submit'>Save</button>
    </Form>
  )
}

const getFrequencyInput = () => screen.getByLabelText('Times') as HTMLInputElement
const getIntervalInput = () => screen.getByLabelText('Interval') as HTMLInputElement

const setInterval = async (user: User, value: string) => {
  const interval = getIntervalInput()
  await user.click(interval)
  await user.clear(interval)
  await user.type(interval, value)
  await user.tab()
}

const setFrequency = async (user: User, value: string) => {
  const frequency = getFrequencyInput()
  await user.click(frequency)
  await user.clear(frequency)
  await user.type(frequency, value)
}

describe('Schedule', () => {
  it('renders default values', () => {
    render(<ScheduleHarness />)

    expect(getFrequencyInput()).toHaveValue('1')
    expect(getIntervalInput()).toHaveValue('1')
  })

  it('accepts typed integer input', async () => {
    const { user } = render(<ScheduleHarness />)
    await setInterval(user, '31')
    await setFrequency(user, '10')

    expect(getFrequencyInput()).toHaveValue('10')
  })

  it('truncates a pasted fractional value on commit', async () => {
    const { user } = render(<ScheduleHarness />)

    const frequency = getFrequencyInput()
    await user.click(frequency)
    await user.clear(frequency)
    await user.paste('1.5')
    await user.tab()

    expect(frequency).toHaveValue('1')
  })

  it('clamps a pasted negative value to the min', async () => {
    const { user } = render(<ScheduleHarness />)

    const frequency = getFrequencyInput()
    await user.click(frequency)
    await user.clear(frequency)
    await user.paste('-3')
    await user.tab()

    expect(frequency).toHaveValue('1')
  })

  it('re-seeds a cleared field to the min on commit', async () => {
    const { user } = render(<ScheduleHarness />)
    await setInterval(user, '31')

    const frequency = getFrequencyInput()
    await user.click(frequency)
    await user.clear(frequency)
    expect(frequency).toHaveValue('')
    await user.tab()

    expect(frequency).toHaveValue('1')
  })

  it('allows typed frequency above the interval', async () => {
    const { user } = render(<ScheduleHarness />)
    await setInterval(user, '5')
    await setFrequency(user, '9')
    await user.tab()

    expect(getFrequencyInput()).toHaveValue('9')
  })

  it('does not clamp frequency when the interval commits to a smaller window', async () => {
    const { user } = render(<ScheduleHarness />)
    await setInterval(user, '31')
    await setFrequency(user, '10')
    expect(getFrequencyInput()).toHaveValue('10')

    await setInterval(user, '5')

    expect(getFrequencyInput()).toHaveValue('10')
  })

  it('does not clamp frequency when the unit change shrinks the window', async () => {
    const { user } = render(<ScheduleHarness />)
    await setInterval(user, '2')

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Weeks' }))
    await setFrequency(user, '10')
    expect(getFrequencyInput()).toHaveValue('10')

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Days' }))

    expect(getFrequencyInput()).toHaveValue('10')
  })

  it('does not show the cross-field error before form submission', async () => {
    const { user } = render(<ScheduleFormHarness />)
    await setFrequency(user, '2')
    await user.tab()

    expect(
      screen.queryByText(/Number of times must not exceed the interval \(1 days\)/i),
    ).not.toBeInTheDocument()
  })

  it('blocks an invalid submission and shows the interval day count', async () => {
    const onSubmit = vi.fn()
    const { user } = render(<ScheduleFormHarness onSubmit={onSubmit} />)
    await setFrequency(user, '8')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText(/Number of times must not exceed the interval \(1 days\)/i),
    ).toBeInTheDocument()
  })

  it('uses the converted day count for week intervals', async () => {
    const { user } = render(<ScheduleFormHarness />)
    await setInterval(user, '2')
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Weeks' }))
    await setFrequency(user, '15')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      screen.getByText(/Number of times must not exceed the interval \(14 days\)/i),
    ).toBeInTheDocument()
  })

  it.each([
    ['frequency', async (user: User) => setFrequency(user, '1')],
    ['interval', async (user: User) => setInterval(user, '2')],
    [
      'interval unit',
      async (user: User) => {
        await user.click(screen.getByRole('combobox'))
        await user.click(screen.getByRole('option', { name: 'Week' }))
      },
    ],
  ])('clears the error when %s changes after submission', async (_, change) => {
    const { user } = render(<ScheduleFormHarness />)
    await setFrequency(user, '2')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(
      screen.getByText(/Number of times must not exceed the interval \(1 days\)/i),
    ).toBeInTheDocument()

    await change(user)

    expect(
      screen.queryByText(/Number of times must not exceed the interval \(1 days\)/i),
    ).not.toBeInTheDocument()
  })

  it('submits a valid schedule', async () => {
    const onSubmit = vi.fn()
    const { user } = render(<ScheduleFormHarness onSubmit={onSubmit} />)
    await setInterval(user, '3')
    await setFrequency(user, '2')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
