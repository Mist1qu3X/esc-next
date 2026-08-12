import './globals.css';
import '@/components/Header/Header.css';
import '@/components/Footer/Footer.css';
import CookieConsent from '@/components/CookieConsent/CookieConsent';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://esc-shooting.org';

export const metadata = {
  metadataBase: new URL(SITE),
  title: 'ESC Shooting | European Shooting Confederation',
  description: 'Official website of the European Shooting Confederation',
  openGraph: {
    siteName: 'European Shooting Confederation',
    type: 'website',
    locale: 'en',
    url: SITE,
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}