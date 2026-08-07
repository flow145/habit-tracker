import { type RenderOptions, render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import type { ReactElement, ReactNode } from 'react'

import { closeDb } from '~/shared/db'

interface ProvidersProps {
  children: ReactNode
}

const Providers = ({ children }: ProvidersProps) => {
  return <div>{children}</div>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => ({
  ...render(ui, { wrapper: Providers, ...options }),
  user: userEvent.setup(),
})

export * from '@testing-library/react'
export { customRender as render }

export const resetTestDb = async () => {
  await closeDb()
  window.indexedDB = new IDBFactory()
}
