import { Toast } from '@base-ui/react/toast'

import { clsx } from 'clsx'
import styles from './Snackbar.module.css'

export interface SnackbarProps {
  toast: Toast.Root.Props['toast']
}

export const Snackbar = ({ toast }: SnackbarProps) => (
  <Toast.Root toast={toast} className={styles.snackbar}>
    <Toast.Content>
      <Toast.Title className={clsx(styles.title, 'body-sm')} />
    </Toast.Content>
  </Toast.Root>
)
