import type { Metadata, Viewport } from 'next';
import './globals.css';

// 1. Додаємо колір теми для статус-бару телефону
export const viewport: Viewport = {
  themeColor: '#FF6E00',
};

// 2. Підключаємо маніфест та специфічні теги для Apple (iPhone)
export const metadata: Metadata = {
  title: 'Energy Safe',
  description: 'Плануйте енергозабезпечення без складних розрахунків',
  manifest: '/manifest.json', // <-- ВАЖЛИВО!
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Energy Safe',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}