import "../styles/globals.css";
import "../styles/beacon.css";
import "../styles/brand-tokens.css";
import "../lib/i18nClient";
import ErrorBoundary from "../components/ErrorBoundary";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "../lib/useTranslationStub";

export default function App({ Component, pageProps }: AppProps) {
  const { i18n } = useTranslation("common");
  const router = useRouter();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = i18n.language || "en";
    }
  }, [i18n.language]);

  // Scroll to top on route change - More reliable with immediate scroll
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Immediate scroll WITHOUT smooth behavior for reliability
      if (typeof window !== 'undefined' && document.documentElement) {
        // Method 1: Direct scroll
        window.scrollTo(0, 0);
        // Method 2: document.scrollingElement (more reliable)
        if (document.scrollingElement) {
          document.scrollingElement.scrollTop = 0;
        }
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
