import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kogelosuites.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/stay', '/stay/'],
        disallow: [
          '/',
          '/dashboard',
          '/bookings',
          '/bookings-enhanced',
          '/calendar',
          '/booking-calendar',
          '/guests',
          '/payments',
          '/reports',
          '/reports-custom',
          '/settings',
          '/expenses',
          '/expenses-enhanced',
          '/properties',
          '/unit-types',
          '/unit-performance',
          '/discounts',
          '/tax',
          '/alerts',
          '/integrations',
          '/menu',
          '/data-management',
          '/dashboard-analytics',
          '/balance-sheet',
          '/requests',
          '/onboarding',
          '/upgrade',
          '/auth/',
          '/api/',
          '/api-docs/',
          '/stay/auth/',
          '/stay/checkout',
          '/stay/my-bookings',
          '/stay/wishlist',
          '/stay/profile',
          '/stay/book/',
          '/stay/payment-callback',
          '/stay/review',
          '/stay/receipt/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
