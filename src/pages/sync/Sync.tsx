import { ChevronLeft, LoaderCircle, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { checkAuth, useAuthState } from '~/entities/auth'
import { usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Layout } from '~/shared/ui/Layout'

import { SignInForm } from './SignInForm'
import styles from './Sync.module.css'
import { SyncStatus } from './SyncStatus'

export const Sync = () => {
  const { t } = useTranslation()
  const auth = useAuthState()

  usePageTitle(t('Sync.title'))

  return (
    <>
      {(auth.status === 'checking' || auth.status === 'unreachable') && (
        <Layout
          title={t('Sync.title')}
          startSlot={
            <Button
              variant='ghost'
              icon={<ChevronLeft />}
              as='Link'
              to={Path.Home}
              aria-label={t('shared.back')}
            />
          }
        >
          {auth.status === 'checking' && (
            <div className={styles.loading} aria-busy>
              <LoaderCircle className={styles.spinner} />
            </div>
          )}
          {auth.status === 'unreachable' && (
            <div className={styles.empty}>
              <h2 className={'subheading'}>{t('Sync.unreachable')}</h2>
              <Button icon={<RotateCcw />} loading={auth.isRetrying} onClick={() => checkAuth()}>
                {t('Sync.retry')}
              </Button>
            </div>
          )}
        </Layout>
      )}
      {auth.status === 'signedOut' && <SignInForm />}
      {auth.status === 'signedIn' && <SyncStatus email={auth.email} />}
    </>
  )
}
