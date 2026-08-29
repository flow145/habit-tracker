import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import enUS from './locales/en-US.json'

const DEFAULT_LOCALE = 'en-US'
// the default date-fns locale is en-US

i18n.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  resources: {
    [DEFAULT_LOCALE]: {
      translation: enUS,
    },
  },
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
  parseMissingKeyHandler: (key) => `[[${key}]]`,
  debug: import.meta.env.DEV,
})

export { i18n }
