import i18n from "./i18nClient";
import { useTranslation as useTranslationBase } from "react-i18next";

export const useTranslation = (namespace: string = "common") => {
  const base = useTranslationBase(namespace);
  const rawT = base.t;

  const safeT = ((key: string, options?: Record<string, unknown>) => {
    const value = rawT(key as never, options as never) as unknown;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    if (typeof options?.defaultValue === "string" && options.defaultValue.trim().length > 0) {
      return options.defaultValue;
    }
    return key;
  }) as typeof base.t;

  return {
    ...base,
    t: safeT,
  };
};

export { i18n };
