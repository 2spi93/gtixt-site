import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { common: require("../public/locales/en/common.json") },
  fr: { common: require("../public/locales/fr/common.json") },
  es: { common: require("../public/locales/es/common.json") },
  de: { common: require("../public/locales/de/common.json") },
  pt: { common: require("../public/locales/pt/common.json") },
  it: { common: require("../public/locales/it/common.json") },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });
}

export default i18n;
