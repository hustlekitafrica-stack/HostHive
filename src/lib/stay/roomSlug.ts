const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function toRoomSlug(name: string, id: string): string {
  const nameSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return nameSlug ? `${nameSlug}-${id}` : id;
}

export function idFromSlug(slug: string): string {
  const m = slug.match(UUID_RE);
  return m ? m[0] : slug;
}
