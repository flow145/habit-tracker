import '~/app/i18n'

import { describe, expect, it } from 'vitest'

import { render, screen } from '~/shared/tests'
import { Schedule } from './Schedule'

type User = ReturnType<typeof render>['user']

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
    render(<Schedule />)

    expect(getFrequencyInput()).toHaveValue('1')
    expect(getIntervalInput()).toHaveValue('1')
  })

  it('accepts typed integer input', async () => {
    const { user } = render(<Schedule />)
    await setInterval(user, '31')
    await setFrequency(user, '10')

    expect(getFrequencyInput()).toHaveValue('10')
  })

  it('truncates a pasted fractional value on commit', async () => {
    const { user } = render(<Schedule />)

    const frequency = getFrequencyInput()
    await user.click(frequency)
    await user.clear(frequency)
    await user.paste('1.5')
    await user.tab()

    expect(frequency).toHaveValue('1')
  })

  it('clamps a pasted negative value to the min', async () => {
    const { user } = render(<Schedule />)

    const frequency = getFrequencyInput()
    await user.click(frequency)
    await user.clear(frequency)
    await user.paste('-3')
    await user.tab()

    expect(frequency).toHaveValue('1')
  })

  it('re-seeds a cleared field to the min on commit', async () => {
    const { user } = render(<Schedule />)
    await setInterval(user, '31')

    const frequency = getFrequencyInput()
    await user.click(frequency)
    await user.clear(frequency)
    expect(frequency).toHaveValue('')
    await user.tab()

    expect(frequency).toHaveValue('1')
  })

  it('clamps typed frequency to the dynamic max', async () => {
    const { user } = render(<Schedule />)
    await setInterval(user, '5')
    await setFrequency(user, '9')
    await user.tab()

    expect(getFrequencyInput()).toHaveValue('5')
  })

  it('clamps frequency when the interval commits to a smaller window', async () => {
    const { user } = render(<Schedule />)
    await setInterval(user, '31')
    await setFrequency(user, '10')
    expect(getFrequencyInput()).toHaveValue('10')

    await setInterval(user, '5')

    expect(getFrequencyInput()).toHaveValue('5')
  })

  it('clamps frequency when the unit change shrinks the window', async () => {
    const { user } = render(<Schedule />)
    await setInterval(user, '2')

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Weeks' }))
    await setFrequency(user, '10')
    expect(getFrequencyInput()).toHaveValue('10')

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Days' }))

    expect(getFrequencyInput()).toHaveValue('2')
  })
})
