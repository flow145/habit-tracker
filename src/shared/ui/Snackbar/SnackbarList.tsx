import { Toast } from '@base-ui/react/toast'

import { Snackbar } from './Snackbar'

export const SnackbarList = () => {
  const { toasts } = Toast.useToastManager()

  return toasts.map((toast) => <Snackbar key={toast.id} toast={toast} />)
}
