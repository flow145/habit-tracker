import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog'
import type { ReactElement, ReactNode } from 'react'

import styles from './Dialog.module.css'

export interface DialogProps extends Omit<BaseAlertDialog.Root.Props, 'children'> {
  title: ReactNode
  children: ReactNode
}

export interface DialogTriggerProps
  extends Omit<BaseAlertDialog.Trigger.Props, 'children' | 'render'> {
  children: ReactElement
}

export interface DialogCloseProps {
  children: ReactElement
}

const Dialog = ({ title, children, ...props }: DialogProps) => {
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

const DialogTrigger = ({ children, ...props }: DialogTriggerProps) => {
  return <BaseAlertDialog.Trigger render={children} {...props} />
}

const DialogClose = ({ children }: DialogCloseProps) => {
  return <BaseAlertDialog.Close render={children} />
}

export const DialogExtended = Object.assign(Dialog, {
  createHandle: BaseAlertDialog.createHandle,
  Trigger: DialogTrigger,
  Title: BaseAlertDialog.Title,
  Description: BaseAlertDialog.Description,
  Close: DialogClose,
})
