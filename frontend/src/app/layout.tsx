import './globals.css';
import GoogleAnalytics from '@/components/GoogleAnalytics/googleanalytics';
import { WebVitals } from '@/components/GoogleAnalytics/WebVitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        {children}
        <GoogleAnalytics />
        <WebVitals />
      </body>
    </html>
  );
}
