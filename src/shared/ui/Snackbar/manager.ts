import { Toast } from '@base-ui/react/toast'

export const toastManager = Toast.createToastManager()

const pendingMessages: string[] = []
let isShowingMessage = false
let isMounted = false

const showNextMessage = () => {
  if (!isMounted || isShowingMessage) return

  const message = pendingMessages.shift()
  if (message === undefined) return

  isShowingMessage = true
  toastManager.add({
    title: message,
    onRemove() {
      isShowingMessage = false
      queueMicrotask(showNextMessage)
    },
  })
}

export const showSnackbar = (message: string) => {
  pendingMessages.push(message)
  showNextMessage()
}

export const setSnackbarMounted = (mounted: boolean) => {
  isMounted = mounted
  if (mounted) showNextMessage()
  else isShowingMessage = false
}
