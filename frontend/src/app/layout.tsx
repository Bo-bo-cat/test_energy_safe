import type { Metadata, Viewport } from 'next';
import './globals.css';

import { ServiceWorkerRegister } from '../components/ServiceWorkerRegister/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#FF6E00',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://energyapp.fun'),
  title: {
    default: 'Energy Safe',
    template: '%s | Energy Safe',
  },
  description: 'Плануйте енергозабезпечення без складних розрахунків. Розрахуйте навантаження, підберіть ДБЖ та збережіть сценарії для дому або офісу.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Energy Safe',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    siteName: 'Energy Safe',
    title: 'Energy Safe — Плануйте енергозабезпечення без складних розрахунків',
    description: 'Розрахуйте навантаження, підберіть ДБЖ та збережіть сценарії для дому або офісу.',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Energy Safe',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Energy Safe — Плануйте енергозабезпечення без складних розрахунків',
    description: 'Розрахуйте навантаження, підберіть ДБЖ та збережіть сценарії для дому або офісу.',
    images: ['/icon-512x512.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
