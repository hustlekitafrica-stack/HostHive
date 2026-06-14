import type { MetadataRoute } from 'next';
import { publicSupabase } from '@/lib/supabase/public';
import { toRoomSlug } from '@/lib/stay/roomSlug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kogelosuites.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/stay`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/stay/rooms`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stay/dining`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    const { data: properties } = await publicSupabase
      .from('properties')
      .select('id, name, updated_at')
      .eq('status', 'active');

    const roomPages: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
      url: `${baseUrl}/stay/rooms/${toRoomSlug(p.name, p.id)}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [...staticPages, ...roomPages];
  } catch {
    return staticPages;
  }
}
