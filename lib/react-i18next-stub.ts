// Stub for react-i18next to prevent runtime errors
// Real i18n will be implemented after fixing dependencies

export const useTranslation = (ns?: string) => {
  return {
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: {
      language: "en",
      changeLanguage: async (lang: string) => lang,
      use: () => ({ init: () => {} }),
      init: () => {},
      isInitialized: true,
    },
    ready: true,
  };
};

export const initReactI18next = {
  type: 3,
  init: () => {},
  use: () => ({ init: () => {} }),
};

export const I18nextProvider = ({ children }: any) => children;
