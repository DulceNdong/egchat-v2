import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './es.json';
import fr from './fr.json';

i18n
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, fr: { translation: fr } },
    lng: localStorage.getItem('kyc_lang') ?? 'es',
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('kyc_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;
