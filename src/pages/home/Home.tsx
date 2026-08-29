import { Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Header } from '~/shared/components/Header'
import { IconButton } from '~/shared/components/IconButton'

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
            <IconButton aria-label={t('home.addHabit')} icon={<Plus size={32} />} variant='ghost' />
            <IconButton
              aria-label={t('home.settings')}
              icon={<Settings size={32} />}
              variant='ghost'
            />
          </>
        }
      />
      <main className={styles.main}></main>
    </>
  )
}
