import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/messages/en.json';
import de from '@/messages/de.json';
import es from '@/messages/es.json';
import fr from '@/messages/fr.json';
import ja from '@/messages/ja.json';
import zh from '@/messages/zh.json';
import pt from '@/messages/pt.json';
import ko from '@/messages/ko.json';
import ar from '@/messages/ar.json';
import tr from '@/messages/tr.json';

const resources = { en, de, es, fr, ja, zh, pt, ko, ar, tr };

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v3',
  });
}

export default i18n;

export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
  { code: 'pt', name: 'Português' },
  { code: 'ko', name: '한국어' },
  { code: 'ar', name: 'العربية' },
  { code: 'tr', name: 'Türkçe' },
];
