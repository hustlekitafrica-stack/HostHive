import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { DynamicFavicon } from "@/components/pwa/DynamicFavicon";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kogelosuites.com';

export const viewport: Viewport = {
  themeColor: '#0f766e',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Kogelo Suites — Hotel & Accommodation in Kisumu, Kenya',
    template: '%s | Kogelo Suites',
  },
  description:
    'Fully furnished rooms with kitchenettes, a restaurant & bar, and a pool open to all guests — any time of day. Experience genuine Kenyan hospitality at Kogelo Suites, Milimani, Museum Road, Kisumu, Kenya.',
  keywords: [
    'Kogelo Suites',
    'hotel Kisumu',
    'accommodation Kisumu Kenya',
    'hotel Milimani Kisumu',
    'hotel Museum Road Kisumu',
    'rooms with kitchenette Kisumu',
    'swimming pool hotel Kisumu',
    'restaurant and bar Kisumu',
    'book hotel Kenya',
  ],
  authors: [{ name: 'Kogelo Suites' }],
  creator: 'Kogelo Suites',
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kogelo Suites',
  },
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    url: `${BASE_URL}/stay`,
    siteName: 'Kogelo Suites',
    title: 'Kogelo Suites — Hotel & Accommodation in Kisumu, Kenya',
    description:
      'Fully furnished rooms with kitchenettes, a restaurant & bar, and a pool open to all guests. Kogelo Suites, Milimani, Museum Road, Kisumu, Kenya.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Kogelo Suites — Hotel on Museum Road, Kisumu, Kenya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kogelo Suites — Hotel & Accommodation in Kisumu, Kenya',
    description:
      'Fully furnished rooms with kitchenettes, restaurant & bar, and a pool open 24/7. Kogelo Suites, Milimani, Kisumu.',
    images: ['/images/og-image.jpg'],
  },
  alternates: {
    canonical: `${BASE_URL}/stay`,
  },
};

const lodgingBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LodgingBusiness',
  name: 'Kogelo Suites',
  url: `${BASE_URL}/stay`,
  description:
    'Kogelo Suites is a hotel in Milimani, on Museum Road, Kisumu, Kenya, offering fully furnished rooms with kitchenettes, a restaurant and bar, and a swimming pool accessible to all guests at any time.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Museum Road, Milimani',
    addressLocality: 'Kisumu',
    addressRegion: 'Kisumu County',
    addressCountry: 'KE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '-0.1022',
    longitude: '34.7617',
  },
  telephone: process.env.ADMIN_PHONE || '',
  starRating: {
    '@type': 'Rating',
    ratingValue: '5',
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Swimming Pool', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Restaurant', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Free WiFi', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Parking', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Room Service', value: true },
    { '@type': 'LocationFeatureSpecification', name: '24-hour Security', value: true },
  ],
  image: `${BASE_URL}/images/og-image.jpg`,
  priceRange: 'KES',
  currenciesAccepted: 'KES',
  paymentAccepted: 'Cash, Mobile Money (M-Pesa)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingBusinessJsonLd) }}
        />
        {children}
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <ServiceWorkerRegistration />
        <DynamicFavicon />
      </body>
    </html>
  );
}
