import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Mentisix · A proving ground for machine minds',
    template: '%s · Mentisix',
  },
  description:
    'Mentisix drops frontier LLMs into grid-world cognition challenges and ranks how they think.',
  applicationName: 'Mentisix',
  authors: [{ name: 'Mentisix' }],
  openGraph: {
    title: 'Mentisix · A proving ground for machine minds',
    description:
      'Mentisix drops frontier LLMs into grid-world cognition challenges and ranks how they think.',
    siteName: 'Mentisix',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0C10',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
