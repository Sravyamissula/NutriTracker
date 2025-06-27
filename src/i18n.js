
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'zh', name: '中文 (简体)' }, // Mandarin Chinese (Simplified)
  { code: 'ar', name: 'العربية' }, // Arabic
  { code: 'fr', name: 'Français' }, // French
  { code: 'pt', name: 'Português' }, // Portuguese
  { code: 'ru', name: 'Русский' }, // Russian
  { code: 'de', name: 'Deutsch' }, // German
  { code: 'ja', name: '日本語' }, // Japanese
];

// Mapping for Gemini language names
export const geminiLanguageMap = {
  en: 'English',
  es: 'Spanish',
  hi: 'Hindi',
  zh: 'Simplified Chinese',
  ar: 'Arabic',
  fr: 'French',
  pt: 'Portuguese',
  ru: 'Russian',
  de: 'German',
  ja: 'Japanese',
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: supportedLanguages.map(l => l.code),
    fallbackLng: 'en',
    debug: false, // Set to false to avoid import.meta.env.DEV issues
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Path to translation files
    },
     react: {
      useSuspense: true, // Recommended for better user experience
    }
  });

export default i18n;
