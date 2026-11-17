import { ChevronLeft, LoaderCircle, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { authClient } from '~/shared/auth'
import { usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { Button } from '~/shared/ui/Button'
import { Layout } from '~/shared/ui/Layout'

import { SignInForm } from './SignInForm'
import styles from './Sync.module.css'
import { SyncStatus } from './SyncStatus'

export const Sync = () => {
  const { t } = useTranslation()
  const { data: auth, error, isPending, refetch } = authClient.useSession()

  const isUnreachable = !isPending && !auth && error && error.status !== 401
  const isNotAuthenticated = !isPending && !auth && !isUnreachable
  const isAuthenticated = !isPending && auth

  usePageTitle(t('Sync.title'))

  return (
    <>
      {isPending && (
        <div className={styles.loading} aria-busy>
          <LoaderCircle className={styles.spinner} />
        </div>
      )}
      {isUnreachable && (
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
          <div className={styles.empty}>
            <h2 className={'subheading'}>{t('Sync.unreachable')}</h2>
            <Button icon={<RotateCcw />} onClick={() => refetch()}>
              {t('Sync.retry')}
            </Button>
          </div>
        </Layout>
      )}
      {isNotAuthenticated && <SignInForm />}
      {isAuthenticated && <SyncStatus email={auth.user.email} />}
    </>
  )
}
