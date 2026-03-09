import type { Metadata } from 'next';
import '../styles/globals.css';
import '../styles/gtixt-institutional.css';
import ExtensionErrorGuard from '@/components/system/ExtensionErrorGuard';

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
      <body>
        <ExtensionErrorGuard />
        {children}
      </body>
    </html>
  );
}
