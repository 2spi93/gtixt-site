// i18n stub - simplified to prevent build/runtime errors
// TODO: Re-enable i18n after fixing import mechanism

let resources: any = {
  en: { common: {} },
  fr: { common: {} },
  es: { common: {} },
  de: { common: {} },
  pt: { common: {} },
  it: { common: {} },
};

const i18n = {
  t: (key: string) => key,
  language: "en",
  changeLanguage: (lang: string) => Promise.resolve(),
};

export default i18n;
