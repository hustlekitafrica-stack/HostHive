const UUID_RE     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_RE_END = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toRoomSlug(slug: string | null | undefined, name: string, id: string): string {
  if (slug) return slug;
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return nameSlug || id;
}

export function isUUID(s: string): boolean {
  return UUID_RE.test(s);
}

export function idFromSlug(slug: string): string {
  if (UUID_RE.test(slug)) return slug;
  const m = slug.match(UUID_RE_END);
  return m ? m[0] : slug;
}
