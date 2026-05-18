-- 17_property_reviews.sql
create table if not exists public.property_reviews (
  id             uuid primary key default gen_random_uuid(),
  property_id    uuid not null references public.properties(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  reviewer_name  text not null,
  rating         integer not null check (rating between 1 and 5),
  cleanliness    integer check (cleanliness between 1 and 5),
  accuracy       integer check (accuracy between 1 and 5),
  checkin        integer check (checkin between 1 and 5),
  communication  integer check (communication between 1 and 5),
  location_score integer check (location_score between 1 and 5),
  value_score    integer check (value_score between 1 and 5),
  comment        text not null,
  created_at     timestamptz default now(),
  unique (property_id, user_id)
);

alter table public.property_reviews enable row level security;

create policy "reviews_public_select" on public.property_reviews
  for select using (true);

create policy "reviews_auth_insert" on public.property_reviews
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy "reviews_own_update" on public.property_reviews
  for update to authenticated
  using (auth.uid() = user_id);

create policy "reviews_own_delete" on public.property_reviews
  for delete to authenticated
  using (auth.uid() = user_id);
