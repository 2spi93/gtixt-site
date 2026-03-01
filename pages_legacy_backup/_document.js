import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const currentPath = ctx.req?.url || "/";
    return { ...initialProps, currentPath };
  }

  render() {
    const { currentPath } = this.props;
    const languages = ["en", "fr", "es", "de", "pt", "it"];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gtixt.com";
    
    // Generate hreflang links for all language variants
    const hreflangs = languages.map((lang) => (
      <link
        key={lang}
        rel="alternate"
        hrefLang={lang}
        href={`${baseUrl}${currentPath}`}
      />
    ));

    // Add x-default hreflang pointing to English
    hreflangs.push(
      <link
        key="x-default"
        rel="alternate"
        hrefLang="x-default"
        href={`${baseUrl}${currentPath}`}
      />
    );

    return (
      <Html lang="en">
        <Head>
          {/* Multilingual SEO */}
          {hreflangs}

          {/* Fail-safe: ensure body is visible even if hydration fails */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                "(function(){try{var el=document.querySelector('style[data-next-hide-fouc]');if(el&&el.parentNode){el.parentNode.removeChild(el);}document.documentElement.style.visibility='visible';document.body&& (document.body.style.display='block');}catch(e){}})();",
            }}
          />

          {/* Primary favicon - SVG for best quality and scalability */}
          <link rel="icon" href="/favicon/icon.svg" type="image/svg+xml" />
          
          {/* Fallback PNG favicons for broader browser compatibility */}
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon/icon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon/icon-16x16.png" />
          
          {/* Apple touch icons for iOS home screen */}
          <link rel="apple-touch-icon" sizes="192x192" href="/favicon/icon-192x192.png" />
          <link rel="apple-touch-icon" sizes="512x512" href="/favicon/icon-512x512.png" />
          
          {/* Manifest for PWA support and browser customization */}
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Browser chrome theme color (matches brand cyan) */}
          <meta name="theme-color" content="#00D1C1" />
          
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}