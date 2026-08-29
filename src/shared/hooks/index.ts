import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export const usePageTitle = (title: string) => {
  const { t } = useTranslation()
  const appName = t('app.title')

  useEffect(() => {
    document.title = `${title} | ${appName}`

    return () => {
      document.title = appName
    }
  }, [title])
}
