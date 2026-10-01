import { Toast } from '@base-ui/react/toast'
import { type ReactNode, useEffect } from 'react'
import { setSnackbarMounted, toastManager } from './manager'
import styles from './Snackbar.module.css'
import { SnackbarList } from './SnackbarList'

export interface SnackbarProvider {
  children: ReactNode
}

const TIMEOUT = 4000

export const SnackbarProvider = ({ children }: SnackbarProvider) => {
  useEffect(() => {
    let isCurrentMount = true

    // Wait until Base UI's provider has subscribed to the global manager.
    queueMicrotask(() => {
      if (isCurrentMount) setSnackbarMounted(true)
    })

    return () => {
      isCurrentMount = false
      setSnackbarMounted(false)
    }
  }, [])

  return (
    <Toast.Provider toastManager={toastManager} limit={1} timeout={TIMEOUT}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className={styles.viewport}>
          <SnackbarList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}
