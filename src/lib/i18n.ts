import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const deviceLocale =
  typeof window === 'undefined' ? 'en' : getLocales()[0]?.languageCode ?? 'en';

const STORED_LANG_KEY = '@language';

// Initialize i18n synchronously with device locale, then update from storage
i18n.use(initReactI18next).init({
  resources: {
    en: { common: require('../locales/en/common.json') },
    zh: { common: require('../locales/zh/common.json') },
  },
  lng: deviceLocale,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

// Hydrate persisted language only in environments with browser storage.
if (typeof window !== 'undefined') {
  AsyncStorage.getItem(STORED_LANG_KEY).then((storedLang) => {
    if (storedLang && storedLang !== i18n.language) {
      i18n.changeLanguage(storedLang);
    }
  });
}

export default i18n;
