import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'
import type { ReactElement, ReactNode } from 'react'

import styles from './AlertDialog.module.css'

export interface AlertDialogProps extends Omit<BaseAlertDialog.Root.Props, 'children'> {
  title: ReactNode
  children: ReactNode
}

export interface AlertDialogTriggerProps
  extends Omit<BaseAlertDialog.Trigger.Props, 'children' | 'render'> {
  children: ReactElement
}

export interface AlertDialogCloseProps {
  children: ReactElement
}

const AlertDialog = ({ title, children, ...props }: AlertDialogProps) => {
  return (
    <BaseAlertDialog.Root {...props}>
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className={styles.backdrop} />
        <BaseAlertDialog.Viewport className={styles.viewport}>
          <BaseAlertDialog.Popup className={styles.popup}>{children}</BaseAlertDialog.Popup>
        </BaseAlertDialog.Viewport>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  )
}

const AlertDialogTrigger = ({ children, ...props }: AlertDialogTriggerProps) => {
  return <BaseAlertDialog.Trigger render={children} {...props} />
}

const AlertDialogClose = ({ children }: AlertDialogCloseProps) => {
  return <BaseAlertDialog.Close render={children} />
}

export const AlertDialogExtended = Object.assign(AlertDialog, {
  createHandle: BaseAlertDialog.createHandle,
  Trigger: AlertDialogTrigger,
  Title: BaseAlertDialog.Title,
  Description: BaseAlertDialog.Description,
  Close: AlertDialogClose,
})
