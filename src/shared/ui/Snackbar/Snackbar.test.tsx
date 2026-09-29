import { act } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { render, screen } from '~/shared/tests'

import { showSnackbar } from './manager'
import { SnackbarProvider } from './SnackbarProvider'

afterEach(() => {
  vi.useRealTimers()
})

it('shows queued messages one at a time in arrival order', async () => {
  vi.useFakeTimers()
  showSnackbar('First message')
  showSnackbar('Second message')
  showSnackbar('Second message')
  render(<SnackbarProvider>{null}</SnackbarProvider>)

  await act(async () => {
    await Promise.resolve()
  })

  expect(screen.getByText('First message')).toBeInTheDocument()
  expect(screen.queryByText('Second message')).not.toBeInTheDocument()

  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000)
  })

  expect(screen.queryByText('First message')).not.toBeInTheDocument()
  expect(screen.getByText('Second message')).toBeInTheDocument()

  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000)
  })

  expect(screen.getByText('Second message')).toBeInTheDocument()

  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000)
  })

  expect(screen.queryByText('Second message')).not.toBeInTheDocument()
})
