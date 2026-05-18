-- ── Wishlists (guest saved properties) ───────────────────────────────────────
create table if not exists guest_wishlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(user_id, property_id)
);

-- Enable RLS
alter table guest_wishlists enable row level security;

-- Users can only see and manage their own wishlist
create policy "wishlist_select_own" on guest_wishlists
  for select using (auth.uid() = user_id);

create policy "wishlist_insert_own" on guest_wishlists
  for insert with check (auth.uid() = user_id);

create policy "wishlist_delete_own" on guest_wishlists
  for delete using (auth.uid() = user_id);
