import "../styles/globals.css";
import "../styles/beacon.css";
import "../styles/brand-tokens.css";
import "../lib/i18nClient";
import ErrorBoundary from "../components/ErrorBoundary";
import type { AppProps } from "next/app";
import { useTranslation } from "../lib/useTranslationStub";

export default function App({ Component, pageProps }: AppProps) {
  const { t } = useTranslation("common");
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
