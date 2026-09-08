import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { setThemePreference, type ThemePreference, useThemeStore } from '~/app/theme'
import { Button } from '~/shared/components/Button'
import { Header } from '~/shared/components/Header'
import { Select, type SelectItem } from '~/shared/components/Select'
import { Path } from '~/shared/constants'
import { usePageTitle } from '~/shared/hooks'

import styles from './Settings.module.css'

export const Settings = () => {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.themePreference)

  usePageTitle(t('Settings.title'))

  const themeItems: SelectItem[] = [
    { value: 'system', label: t('Settings.themeOptions.system') },
    { value: 'light', label: t('Settings.themeOptions.light') },
    { value: 'dark', label: t('Settings.themeOptions.dark') },
  ]

  const handleThemeChange = (item: SelectItem | null) => {
    if (item === null) return
    setThemePreference(item.value as ThemePreference)
  }

  return (
    <>
      <Header
        title={t('Settings.title')}
        startSlot={
          <Button
            variant='ghost'
            icon={<ChevronLeft />}
            as='Link'
            to={Path.Home}
            aria-label={t('shared.back')}
          />
        }
      />
      <main className={styles.main}>
        <ul className={styles.list}>
          <li className={styles.item}>
            <Select
              label={t('Settings.colorTheme')}
              items={themeItems}
              layout='inline'
              value={themeItems.find(({ value }) => value === theme)}
              onValueChange={handleThemeChange}
            />
          </li>
        </ul>
      </main>
    </>
  )
}
