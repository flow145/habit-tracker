import { type RenderOptions, render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import type { ReactElement, ReactNode } from 'react'

import { closeDb } from '~/shared/api'
import { Day } from '~/shared/lib'

interface ProvidersProps {
  children: ReactNode
}

/** @param [month=1] 1-12 */
export const date = (day: number, month = 1, hour = 0, minute = 0) =>
  new Date(2026, month - 1, day, hour, minute)

export const day = (dayOfMonth: number, month = 1) => new Day(date(dayOfMonth, month))

const Providers = ({ children }: ProvidersProps) => {
  return <div>{children}</div>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => ({
  ...render(ui, { wrapper: Providers, ...options }),
  user: userEvent.setup(),
})

export const resetTestDb = async () => {
  await closeDb()
  window.indexedDB = new IDBFactory()
}

export * from '@testing-library/react'
export { customRender as render }
