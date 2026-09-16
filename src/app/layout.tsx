import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const display = Geist({ variable: '--font-display', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });
const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'https://progress-map.vercel.app';
const description =
  'Track Nigeria government projects from planning to completion. Search federal, state, and LGA projects to discover their status, budget utilization, and progress updates.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Progress Map',
    template: '%s | Progress Map',
  },
  description,
  applicationName: 'Progress Map',
  authors: [{ name: 'Nigeria Government', url: baseUrl }],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Progress Map',
    description,
    siteName: 'Progress Map',
    type: 'website',
    url: baseUrl,
    locale: 'en_US',
    alternateLocale: ['en_GB'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Progress Map',
    description,
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable}`}>
        {children}
        <Analytics debug={false} />
      </body>
    </html>
  );
}
