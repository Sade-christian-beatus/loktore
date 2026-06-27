import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import fr from './locales/fr.json'
import moore from './locales/moore.json'
import jula from './locales/jula.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      moore: { translation: moore },
      jula: { translation: jula },
    },
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'loktore.lang',
      caches: ['localStorage'],
    },
  })

export default i18n
