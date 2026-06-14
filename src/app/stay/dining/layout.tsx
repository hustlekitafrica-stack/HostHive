import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kogelosuites.com';

export const metadata: Metadata = {
  title: 'Restaurant & Dining',
  description:
    'Enjoy authentic Kenyan and continental cuisine at the Kogelo Suites restaurant. Order meals to your room or dine in our garden lounge.',
  alternates: {
    canonical: `${BASE_URL}/stay/dining`,
  },
  openGraph: {
    title: 'Restaurant & Dining | Kogelo Suites',
    description:
      'Enjoy authentic Kenyan and continental cuisine at the Kogelo Suites restaurant. Order meals to your room or dine in our garden lounge.',
    url: `${BASE_URL}/stay/dining`,
    siteName: 'Kogelo Suites',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kogelo Suites Restaurant',
      },
    ],
    type: 'website',
    locale: 'en_KE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restaurant & Dining | Kogelo Suites',
    description:
      'Enjoy authentic Kenyan and continental cuisine at the Kogelo Suites restaurant.',
    images: ['/images/og-image.jpg'],
  },
};

export default function DiningLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
