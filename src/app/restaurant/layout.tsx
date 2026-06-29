import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_RESTAURANT_DOMAIN
  ? ('https://' + process.env.NEXT_PUBLIC_RESTAURANT_DOMAIN)
  : 'https://restaurant.kogelosuites.com';

export const metadata: Metadata = {
  title: 'Kogelo Restaurant — Order Online',
  description:
    'Order authentic Kenyan meals from Kogelo Restaurant. Room service, dine in, or delivery. Breakfast, main dishes, sharing bites, drinks and more.',
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: 'Kogelo Restaurant — Order Online',
    description: 'Authentic Kenyan flavours. Room service · Dine In · Delivery.',
    url: BASE_URL,
    siteName: 'Kogelo Restaurant',
    type: 'website',
    locale: 'en_KE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kogelo Restaurant — Order Online',
    description: 'Authentic Kenyan flavours. Room service · Dine In · Delivery.',
  },
};

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
