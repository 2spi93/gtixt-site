import Document, { Html, Head, Main, NextScript } from "next/document";
import { useTranslation } from "../lib/useTranslationStub";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: any) {
    const initialProps = await Document.getInitialProps(ctx);
    const currentPath = ctx.req?.url || "/";
    return { ...initialProps, currentPath };
  }

  render() {
    const { currentPath } = this.props as any;
    const languages = ["en", "fr", "es", "de", "pt", "it"];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://gtixt.com";

    const hreflangs = languages.map((lang) => (
      <link key={lang} rel="alternate" hrefLang={lang} href={`${baseUrl}${currentPath}`} />
    ));

    hreflangs.push(
      <link key="x-default" rel="alternate" hrefLang="x-default" href={`${baseUrl}${currentPath}`} />
    );

    return (
      <Html lang="en">
        <Head>
          {/* Charset encoding */}
          <meta charSet="utf-8" />
          
          {/* Mobile responsiveness - CRITICAL for mobile devices */}
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
          
          {/* Multilingual SEO */}
          {hreflangs}

          {/* Fail-safe: ensure body is visible even if hydration fails */}
          <script
            dangerouslySetInnerHTML={{
              __html:
                "(function(){try{var el=document.querySelector('style[data-next-hide-fouc]');if(el&&el.parentNode){el.parentNode.removeChild(el);}document.documentElement.style.visibility='visible';document.body&& (document.body.style.display='block');}catch(e){}})();",
            }}
          />

          {process.env.NODE_ENV === "development" && (
            <script
              dangerouslySetInnerHTML={{
                __html:
                  "(function(){if(typeof window==='undefined')return;try{var o=document.createElement('div');o.id='__runtime_error_overlay__';o.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;max-height:50vh;overflow:auto;z-index:99999;background:#1b0b0b;color:#ffeaea;border:1px solid #ff7b7b;border-radius:12px;padding:12px;font:12px/1.4 ui-monospace,Menlo,Consolas,monospace;display:none;white-space:pre-wrap;';function addOverlay(){try{if(document&&document.body){document.body.appendChild(o);}}catch(e){console.error('Error adding overlay:',e);}}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',addOverlay,{once:true});}else{addOverlay();}function show(msg){try{o.textContent=msg;o.style.display='block';}catch(e){}}function isExtensionError(stack){return stack&&(stack.includes('chrome-extension://')||stack.includes('moz-extension://')||stack.includes('safari-extension://'));}window.addEventListener('error',function(e){var stack=(e.error&&e.error.stack)||e.filename||'';if(!isExtensionError(stack)){show('Runtime error:\\n'+(e.message||'')+'\n'+(e.error&&e.error.stack?e.error.stack:''));}},false);window.addEventListener('unhandledrejection',function(e){var stack=(e.reason&&e.reason.stack)||'';if(!isExtensionError(stack)){show('Unhandled promise rejection:\\n'+(e.reason&&e.reason.stack?e.reason.stack:String(e.reason||'')));}},false);}catch(e){console.error('Error overlay init failed:',e);}})()",
              }}
            />
          )}

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
