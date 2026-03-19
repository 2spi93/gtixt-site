import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import '../styles/globals.css';
import '../styles/gtixt-institutional.css';
import ExtensionErrorGuard from '@/components/system/ExtensionErrorGuard';

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
  title: 'GTIXT - Governance & Transparency Index',
  description: 'Enterprise-grade compliance intelligence platform for institutional firms',
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
      </body>
    </html>
  );
}
