import { Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'

import { usePageTitle } from '~/shared/hooks'
import styles from './Home.module.css'

export const Home = () => {
  const { t } = useTranslation()

  usePageTitle(t('home.title'))

  return (
    <>
      <Header
        title={t('home.title')}
        endSlot={
          <>
            <Button variant='ghost' icon={<Plus />} aria-label={t('home.addHabit')} />
            <Button variant='ghost' icon={<Settings />} aria-label={t('home.settings')} />
          </>
        }
      />
      <main className={styles.main}></main>
    </>
  )
}
