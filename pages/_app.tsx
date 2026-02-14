import "../styles/globals.css";
import "../styles/beacon.css";
import "../styles/brand-tokens.css";
import "../lib/i18nClient";
import ErrorBoundary from "../components/ErrorBoundary";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useTranslation } from "../lib/useTranslationStub";

export default function App({ Component, pageProps }: AppProps) {
  const { i18n } = useTranslation("common");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = i18n.language || "en";
    }
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
