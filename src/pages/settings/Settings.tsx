import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { usePageTitle } from '~/shared/lib'
import { Path } from '~/shared/routes'
import { setThemePreference, type ThemePreference, useThemeStore } from '~/shared/theme'
import { Button } from '~/shared/ui/Button'
import { Header } from '~/shared/ui/Header'
import { Select, type SelectItem } from '~/shared/ui/Select'

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
