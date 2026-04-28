import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'Fresh As Ever — Rescue Food. Save Money.',
  description: "Colombo's first surplus food rescue marketplace. Buy same-day Rescue Bags from your favourite bakeries, cafés, and restaurants at up to 60% off before closing time. Reserve. Pay. Pickup.",
  keywords: ['surplus food', 'food rescue', 'Colombo', 'Sri Lanka', 'food waste', 'rescue bags', 'bakery deals', 'restaurant deals'],
  authors: [{ name: 'Fresh As Ever' }],
  openGraph: {
    title: 'Fresh As Ever — Rescue Food. Save Money.',
    description: "Buy same-day Rescue Bags from Colombo outlets at up to 60% off. Reserve, pay, and pickup before closing time.",
    type: 'website',
    locale: 'en_LK',
    siteName: 'Fresh As Ever',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fresh As Ever — Rescue Food. Save Money.',
    description: "Buy same-day Rescue Bags from Colombo outlets at up to 60% off.",
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#01696f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={plusJakarta.className}>
        {children}
      </body>
    </html>
  );
}