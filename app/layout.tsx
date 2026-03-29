import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';
import '../styles/gtixt-institutional.css';
import ExtensionErrorGuard from '@/components/system/ExtensionErrorGuard';
import Script from 'next/script';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700'],
  display: 'swap',
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gtixt.com'),
  title: 'GTIXT - Governance & Transparency Index',
  description: 'Enterprise-grade compliance intelligence platform for institutional firms',
  applicationName: 'GTIXT',
  openGraph: {
    type: 'website',
    siteName: 'GTIXT',
    locale: 'en_US',
    title: 'GTIXT - Governance & Transparency Index',
    description: 'Enterprise-grade compliance intelligence platform for institutional firms',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GTIXT - Governance & Transparency Index',
    description: 'Enterprise-grade compliance intelligence platform for institutional firms',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){if(typeof window==='undefined')return;function isExtNoise(v){if(!v)return false;var m=(v&&v.message)||String(v||'');var s=(v&&v.stack)||'';var lower=(m+' '+s).toLowerCase();return lower.indexOf('origin not allowed')!==-1||lower.indexOf('inpage.js')!==-1||lower.indexOf('chrome-extension://')!==-1||lower.indexOf('moz-extension://')!==-1;}window.addEventListener('error',function(e){if(isExtNoise(e&&e.error)||isExtNoise(e&&e.message)||isExtNoise(e&&e.filename)){e.preventDefault&&e.preventDefault();e.stopImmediatePropagation&&e.stopImmediatePropagation();}},true);window.addEventListener('unhandledrejection',function(e){if(isExtNoise(e&&e.reason)){e.preventDefault&&e.preventDefault();e.stopImmediatePropagation&&e.stopImmediatePropagation();}},true);})();",
          }}
        />
        <ExtensionErrorGuard />
        {children}
        {/* Plausible — privacy-first, cookieless analytics. Set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to enable. */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
