import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata = {
  title: 'Fresh As Ever — Rescue Food. Save Money.',
  description: "Colombo's first surplus food rescue marketplace. Buy same-day Rescue Bags from your favourite bakeries, cafés, and restaurants at up to 60% off before closing time.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#004f54', // Canonical Primary
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakarta.variable}>
      <body suppressHydrationWarning className="antialiased min-h-screen font-jakarta bg-background text-text">
        {children}
      </body>
    </html>
  );
}