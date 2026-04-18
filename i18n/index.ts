import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all locale files
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import zh from './locales/zh.json';
import pt from './locales/pt.json';
import ko from './locales/ko.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  ja: { translation: ja },
  zh: { translation: zh },
  pt: { translation: pt },
  ko: { translation: ko },
  ar: { translation: ar },
  tr: { translation: tr },
};

const LANGUAGE_STORAGE_KEY = 'forkme_language';

// Detect device language, falling back to 'en'
const deviceLanguage = Localization.locale?.split('-')[0] || 'en';
const supportedCodes = Object.keys(resources);
const defaultLanguage = supportedCodes.includes(deviceLanguage)
  ? deviceLanguage
  : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3', // Required for Expo/Hermes
});

// Restore persisted language preference
AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((savedLang) => {
  if (savedLang && supportedCodes.includes(savedLang)) {
    i18n.changeLanguage(savedLang);
  }
});

/** Change language and persist the choice */
export async function setLanguage(langCode: string) {
  await i18n.changeLanguage(langCode);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
}

export default i18n;

export const supportedLocales = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];

export { LANGUAGE_STORAGE_KEY };
