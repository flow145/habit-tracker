import { type RenderOptions, render } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { deleteDB } from 'idb'
import type { ReactElement, ReactNode } from 'react'

import { closeDb, DB_NAME } from '~/shared/db'

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

export const deleteTestDb = async () => {
  await closeDb()
  await deleteDB(DB_NAME, {
    blocked() {
      throw new Error(`Deleting ${DB_NAME} was blocked`)
    },
  })
}
