import { useTranslation } from 'react-i18next'

import { useAuthState } from '~/entities/auth'
import { usePageTitle } from '~/shared/lib'

import { SignInForm } from './SignInForm'
import { SyncStatus } from './SyncStatus'

export const Sync = () => {
  const { t } = useTranslation()
  const auth = useAuthState()

  usePageTitle(t('Sync.title'))

  return auth.status === 'signedIn' ? <SyncStatus email={auth.email} /> : <SignInForm />
}
