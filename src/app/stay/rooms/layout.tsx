import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kogelosuites.com';

export const metadata: Metadata = {
  title: 'Rooms & Suites',
  description:
    'Browse all available rooms and suites at Kogelo Suites in Kogelo, Kenya. Studios, one-bedroom and two-bedroom units with modern amenities.',
  alternates: {
    canonical: `${BASE_URL}/stay/rooms`,
  },
  openGraph: {
    title: 'Rooms & Suites | Kogelo Suites',
    description:
      'Browse all available rooms and suites at Kogelo Suites in Kogelo, Kenya. Studios, one-bedroom and two-bedroom units with modern amenities.',
    url: `${BASE_URL}/stay/rooms`,
    siteName: 'Kogelo Suites',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kogelo Suites Rooms',
      },
    ],
    type: 'website',
    locale: 'en_KE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rooms & Suites | Kogelo Suites',
    description:
      'Browse all available rooms and suites at Kogelo Suites in Kogelo, Kenya.',
    images: ['/images/og-image.jpg'],
  },
};

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
