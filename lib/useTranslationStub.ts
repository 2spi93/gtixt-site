import i18n from "./i18nClient";
import { useTranslation as useTranslationBase } from "react-i18next";

export const useTranslation = (namespace: string = "common") => {
  return useTranslationBase(namespace);
};

export { i18n };
